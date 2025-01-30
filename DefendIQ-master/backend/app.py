from flask import Flask, request, jsonify, send_from_directory, abort, g, session
from flask_cors import CORS
from datetime import datetime
import config
import os
import json
import openai
import PyPDF2
from fs.osfs import OSFS
import re
from decimal import Decimal
from psycopg2.extras import RealDictCursor
from pytesseract import image_to_string
from pdf2image import convert_from_path
from docx import Document
from PyPDF2 import PdfReader
import pytesseract

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Get the directory of the current file
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'ClaimDocuments')  # Construct the upload folder path within the project
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
 
    conn = config.get_db_connection()
    cursor = conn.cursor()

    cursor.callproc('find_user', (username, password))
    user = cursor.fetchall()

    cursor.close()
    conn.close()
 
    if user:
        return jsonify({"message": "Login successful", "redirect_url": "/home"})
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/security-questions', methods=['GET'])
def get_security_questions():
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT "questionid", "question" FROM "securityquestions"')
        questions = cursor.fetchall()
        questions_list = [{"id": q[0], "question": q[1]} for q in questions]
        return jsonify(questions_list)
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching security questions", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
 
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    password = data['password']
    security_question_id = data['securityQuestionId']
    security_answer = data['securityAnswer']
    first_name = data['firstName']
    last_name = data['lastName']
    email = data['email']
 
    conn = config.get_db_connection()
    cursor = conn.cursor()
 
    try:
        cursor.execute("""
    INSERT INTO public."Users" 
    ("Username", "Password", "securityquestionid", "SecurityAnswer", "FirstName", "LastName", "Email")
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    RETURNING "UserId";
""", (username, password, security_question_id, security_answer, first_name, last_name, email))

        conn.commit()
        user_id = cursor.fetchone()[0]
        print(f"User ID: {user_id}")

        # Insert default 'Cliam handler' role into UserRoles table
        cursor.execute("""
            INSERT INTO public."UserRoles" ("UserId", "RoleId")
            VALUES (%s, %s);
        """, (user_id, 8))
        
        conn.commit()

        return jsonify({"message": "Registration successful"}), 201
    except Exception as e:
        conn.rollback()
        print(f"Registration error: {str(e)}")
        return jsonify({"message": "Registration failed", "error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/claims', methods=['GET'])
def get_claims():
    try:
        session_user = request.args.get('sessionUser')  # Get the sessionUser from query parameters
        print(f"Session User: {session_user}")
        conn = config.get_db_connection()
        cur = conn.cursor()

        # Check if the sessionUser is a superuser
        cur.execute('''
            SELECT EXISTS (
                SELECT 1 
                FROM "Users" u
                JOIN "UserRoles" ur ON u."UserId" = ur."UserId"
                JOIN "Roles" r ON ur."RoleId" = r."RoleId"
                WHERE u."Username" = %s AND r."RoleName" = 'Super User'
            )
        ''', (session_user,))
        is_superuser = cur.fetchone()[0]

        if is_superuser:
            cur.callproc('get_all_claims')
        else:
            # Fetch claims specific to the user
            cur.execute('SELECT * FROM public.get_user_claims(%s);', (session_user,))

        # Call the stored procedure that returns claims
        
        claims = cur.fetchall()
        cur.close()
        conn.close()
        print('fetch complete')
        # Structuring the response as JSON
        return jsonify([{
            "ClaimNumber": claim[0],
            "PolicyNumber": claim[1],
            "IncidentDiscoveryDate": claim[2],
            "ReportedBy": claim[3],
            "ReportedVia": claim[4],
            "PhoneNumberWithCountryCode": claim[5],
            "Email": claim[6],
            "FaultRatingID": claim[7],
            "Attachments": claim[8],
            "Claimant": claim[9],
            "DateFlagged": claim[10],
            "Status": claim[11],
            "History": claim[12],
            "Contacts": claim[13],
            "Username": claim[14]
        } for claim in claims])
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Error getting claims"}), 500

@app.route('/api/claims/<claimNumber>', methods=['GET'])
def get_claim_details(claimNumber):
    conn = config.get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT * FROM public."Claims" WHERE  "ClaimNumber" = %s', (claimNumber,))
        claim = cursor.fetchone()
        if claim:
            claim_details = {
                'ClaimNumber': claim[0],
                'PolicyNumber': claim[1],
                'Claimant': claim[3],
                'ReportedVia': claim[4],
                'Status': claim[11]
                # Add more fields as necessary
            }
            return jsonify(claim_details)
        else:
            return jsonify({"message": "Claim not found"}), 404
    except Exception as e:
        print (e)
        return jsonify({"message": "Error fetching claim details", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
 
@app.route('/api/policies/<policyNumber>', methods=['GET'])
def get_policy_details(policyNumber):
    conn = config.get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT * FROM "Policies" WHERE "PolicyNumber" = %s', (policyNumber,))
        policy = cursor.fetchone()
        if policy:
            policy_details = {
                'PolicyNumber': policy[0],
                'EffectiveDate': policy[1],
                'ExpirationDate': policy[2],
                'PolicyType': policy[3],
                'EndorsementCode': policy[4],
                'EndorsementDescription': policy[5],
                'EndorsementEffectiveDate': policy[6],
                'EndorsementExpirationDate': policy[7],
                'InsuredName': policy[8],
                'InsuredEmail': policy[9],
                'PolicyStatus': policy[10],
                'Coverages': policy[11],
                'DeviceID': policy[12]
                # Add more fields as necessary
            }
            return jsonify(policy_details)
        else:
            return jsonify({"message": "Policy not found"}), 404
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching policy details", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/policies/<policy_number>', methods=['GET'])
def get_policy(policy_number):
    policy = Policy.query.filter_by(policy_number=policy_number).first()
    if policy:
        endorsements = [
            {
                'code': policy.endorsement_code,
                'description': policy.endorsement_description,
                'effectiveDate': policy.endorsement_effective_date.strftime('%Y-%m-%d'),
                'expirationDate': policy.endorsement_expiration_date.strftime('%Y-%m-%d')
            }
        ]
        return jsonify({
            'insuredName': policy.insured_name,
            'address': policy.address,
            'postCode': policy.post_code,
            'effectiveDate': policy.effective_date.strftime('%Y-%m-%d'),
            'expirationDate': policy.expiration_date.strftime('%Y-%m-%d'),
            'policyType': policy.policy_type,
            'endorsements': endorsements
        })
    else:
        return jsonify({'message': 'Policy not found'}), 404

# API route to get incident details by ClaimNumber
@app.route('/api/incidents/<claimNumber>', methods=['GET'])
def get_incident(claimNumber):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT *  FROM public."Incidents" WHERE  "ClaimNumber" = %s', (claimNumber,))
        incident_details = cursor.fetchone()
        if incident_details:
            incident_details_dict = {
                'IncidentID': incident_details[0],
                'IncidentDescription': incident_details[1],
                'IncidentLocation': incident_details[2],
                'IncidentDate': incident_details[3],
                'IncidentTypeID': incident_details[4],
                'ImpactDescription': incident_details[5],
                'IncidentSubtypeID': incident_details[6],
                'ClaimNumber': incident_details[7]
                # Add more fields as necessary
                }
            return jsonify(incident_details_dict)
        else:
            return jsonify({"message": "Claim not found"}), 404
            return jsonify({"message": "Claim not found"}), 404
    except Exception as e:
            print (e)
            return jsonify({"message": "Error fetching claim details", "error": str(e)}), 500
    finally:
            cursor.close()
            conn.close()

# API route to get reserve details by ClaimNumber
@app.route('/api/reserves/<claimNumber>', methods=['GET'])
def get_reserves(claimNumber):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        # Fetch reserve details for the specific claim number
        cursor.execute('SELECT "ReserveID", "ReserveAmount", "PaymentID", "Payment", "CoverageCode", "ClaimNumber" FROM public."Reserves" WHERE "ClaimNumber" = %s', (claimNumber,))
        reserves = cursor.fetchall()

        reserves_list = []
        for reserve in reserves:
            reserves_list.append({
                "ReserveID": reserve[0],
                "ReserveAmount": reserve[1],
                "PaymentID": reserve[2],
                "Payment": reserve[3],
                "CoverageCode": reserve[4],
                "ClaimNumber": reserve[5]
            })

        return jsonify(reserves_list), 200
    except Exception as e:
        print(f"Error fetching reserves: {e}")
        return jsonify({"message": "Error fetching reserves", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# API route to get history details by ClaimNumber
@app.route('/api/history/<claimNumber>', methods=['GET'])
def get_history(claimNumber):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM public."History" WHERE "ClaimNumber" = %s', (claimNumber,))
        history_details = cursor.fetchall()
        if history_details:
            history_details_list = [
                {
                    'User': history[1],
                    'EventTimestamp': history[2],
                    'Description': history[3],
                    'Type': history[4],
                    'ClaimNumber': history[5]
                    # Add more fields as necessary
                }
                for history in history_details
            ]
            return jsonify(history_details_list)
        else:
            return jsonify({"message": "Claim not found"}), 404
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching history details", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
   
    # API route to get payment details by ClaimNumber
 
@app.route('/api/payments/<claimNumber>', methods=['GET'])
def get_payments(claimNumber):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        # Fetch payment details
        cursor.execute('SELECT * FROM public."Payments" WHERE "ClaimNumber" = %s', (claimNumber,))
        payment_details = cursor.fetchall()

        # Fetch reserve amount for the claim
        cursor.execute('SELECT "ReserveAmount" FROM public."Reserves" WHERE "ClaimNumber" = %s', (claimNumber,))
        reserve_result = cursor.fetchone()
        reserve_amount = reserve_result[0] if reserve_result else 0

        payments = []
        for payment in payment_details:
            print(payment[0])
            payments.append({
                "PaymentID": payment[0],
                "PayeeName": payment[1],
                "CheckAmount": payment[2],
                "AccountNumber": payment[3],
                "IFSCCode": payment[4],
                "UPIID": payment[5],
                "DocumentID": payment[6],
                "BankName": payment[7],
                "BranchLocation": payment[8],
                "MMID": payment[9],
                "Contact": payment[10],
                "ClaimNumber": payment[14],
                "Status": payment[15]
            })

        return jsonify({"payments": payments, "reserve_amount": reserve_amount}), 200
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching payment details", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/user/roles/<username>', methods=['GET'])
def get_user_roles(username):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        # Query to fetch roles based on username
        query = '''
        SELECT 
            u."Username",
            r."RoleName",
            r."RoleDescription",
            r."Permissions",
            r."AuthorityLimit"
        FROM 
            public."Users" u
        JOIN 
            public."UserRoles" ur ON u."UserId" = ur."UserId"
        JOIN 
            public."Roles" r ON ur."RoleId" = r."RoleId"
        WHERE 
            u."Username" = %s
        '''
        cursor.execute(query, (username,))
        roles = cursor.fetchall()

        # Format the result to return as JSON
        role_list = []
        for role in roles:
            role_list.append({
                "Username": role[0],
                "RoleName": role[1],
                "RoleDescription": role[2],
                "Permissions": role[3],
                "AuthorityLimit": role[4]
            })

        if not role_list:
            return jsonify({"message": f"No roles found for user: {username}"}), 404

        return jsonify({"roles": role_list}), 200
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching roles", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API route to get contact details by claimNumber
@app.route('/api/contacts/<claimNumber>', methods=['GET'])
def get_contacts(claimNumber):
    try:
        conn = config.get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "Contacts" WHERE "ClaimNumber" = %s', (claimNumber,))
        contacts = cursor.fetchall()
        contacts_list = [
            {
                'ContactID': c[0],
                'Name': c[1],
                'PhoneNumber': c[2],
                'Email': c[3],
                'Address': c[4],
                'PinCode': c[5],
                'ClaimNumber': c[8]
            } for c in contacts
        ]
        cursor.close()
        conn.close()
        return jsonify(contacts_list)
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching contacts", "error": str(e)}), 500

@app.route('/api/contacts', methods=['POST'])
def create_contact():
    try:
        data = request.json
        conn = config.get_db_connection()
        cursor = conn.cursor()

        # Check if the contact already exists
        cursor.execute('''
            SELECT * FROM "Contacts" WHERE "Name" = %s AND "PhoneNumber" = %s AND "Email" = %s AND "Address" = %s AND "PinCode" = %s AND "ClaimNumber" = %s
        ''', (data['Name'], data['PhoneNumber'], data['Email'], data['Address'], data['PinCode'], data['ClaimNumber']))
        existing_contact = cursor.fetchone()

        if existing_contact:
            return jsonify({"message": "Contact already exists"}), 409

        # Insert the new contact
        cursor.execute('''
            INSERT INTO "Contacts" ("Name", "PhoneNumber", "Email", "Address", "PinCode", "ClaimNumber")
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (data['Name'], data['PhoneNumber'], data['Email'], data['Address'], data['PinCode'], data['ClaimNumber']))

        # Update history
        historyUpdateStatus = update_history('New contact added', 'Contact added', data['ClaimNumber'], data['sessionUser'])
        print(historyUpdateStatus)

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Contact created successfully"}), 201
    except Exception as e:
        print(e)
        return jsonify({"message": "Error creating contact", "error": str(e)}), 500

# API to fetch device details
@app.route('/api/devices', methods=['GET'])
def get_devices():
    try:
        conn = config.get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "Devices"')  # Update the query based on your table schema
        devices = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(devices)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_claims/<int:claim_number>', methods=['GET'])
def get_all_claim_details(claim_number):
    """Fetch claim details by claim number."""
    conn = config.get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Call the PostgreSQL function
            cursor.execute("SELECT * FROM public.get_claim_details(%s)", (claim_number,))
            results = cursor.fetchall()
        
        # Close the connection
        conn.close()

        # If no data is found
        if not results:
            return jsonify({"error": "Claim not found"}), 404
        
        # Return the data in JSON format
        return jsonify(results), 200
    except Exception as e:
        print(f"Error fetching claim details: {e}")
        return jsonify({"error": "Failed to fetch claim details"}), 500

#Get AI recommendation for assessments
# Your OpenAI API key
openai.api_key = 'sk-D_LgXaGuCavbV3XlMvpVEZa6ueU3uK--j9tjcRTxwJT3BlbkFJYgbinBvLHLBdMQB4lfRErg_AnQ919YSOA5yKg_Ia8A'

def read_pdf_file(file_path):
    """Reads a PDF file and extracts its text content."""
    content = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                content += page.extract_text()
    except Exception as e:
        content = f"Error reading PDF: {str(e)}"
    return content

# Route to read files and return their details along with download links
@app.route('/read-files/<claimNumber>', methods=['GET'])
def read_files(claimNumber):
    file_data = []
    claim_folder = os.path.join(app.config['UPLOAD_FOLDER'], claimNumber)

    try:
        # Ensure the claim folder exists
        if not os.path.exists(claim_folder):
            return jsonify({"status": "success", "message": f"No documents found for claim number {claimNumber}", "data":file_data}), 200

        # List all files in the claim folder and create metadata with download URLs 
        for filename in os.listdir(claim_folder):
            file_path = os.path.join(claim_folder, filename)
            if os.path.isfile(file_path):
                # Check if the file is a PDF, and read its content if needed
                if filename.lower().endswith('.pdf'):
                    content = read_pdf_file(file_path)
                else:
                    # Read as a regular text file
                    with open(file_path, 'r', encoding='utf-8') as file:
                        content = file.read()

                # Append file info with a download URL
                file_data.append({
                    "file_name": filename,
                    "content": content,
                    "url": f'/download/{claimNumber}/{filename}'  # Download URL
                })

        return jsonify({"status": "success", "data": file_data}), 200
    except Exception as e:
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

# Route to download a specific document by claim number and filename
@app.route('/download/<claimNumber>/<filename>', methods=['GET'])
def download_file(claimNumber, filename):
    claim_folder = os.path.join(app.config['UPLOAD_FOLDER'], claimNumber)

    # Check if the file exists within the specified claim folder
    file_path = os.path.join(claim_folder, filename)
    if not os.path.isfile(file_path):
        return abort(404, description="File not found")

    # Send the file for download
    return send_from_directory(claim_folder, filename, as_attachment=True)

@app.route('/process-data', methods=['POST'])
def process_data():
    try:
        # Read the JSON payload from the request
        data = request.json

        # Extract 'claimData' and 'filesData' from the payload
        claim_data = data.get('claimData')
        files_data = data.get('filesData')

        prompt = (
                f"{json.dumps(claim_data, indent=2)}\n"
                "This is the detailed claim information for a cyber insurance claim.\n\n"
                f"{json.dumps(files_data, indent=2)}\n"
                "These are the additional documents and data submitted as part of the claim.\n\n"
                "Using this information, analyze the claim and provide the required Assessments and assessment Results:\n\n"
                "and for each type of assessment, summarize the results of the analysis based on the provided data.\n"
                "- Type of Assessment: The category of assessment needed (e.g., forensic investigation, compliance review, etc.).\n"
                "- Key Documents: Relevant documents or data that should be analyzed for the assessment.\n"
                "- Responsible Party: Who should perform this assessment (e.g., forensic investigator, claims adjuster, IT specialist).\n"
                "- Estimated Cost: The approximate cost of the assessment in Indian rupees.\n"
                "- Assessment Focus: The primary objective or focus of the assessment (e.g., identifying the origin of the attack, evaluating financial impact).\n\n"
                "- Result Summary: A brief summary of the findings.\n"
                "- Key Insights: Key takeaways or findings from the assessment.\n"
                "- Recommended Next Steps: Specific actions that should be taken based on the findings.\n\n"
                "Provide the output strictly in a JSON format. The root object should contain only 1 keys 'assessment_details'.\n"
                "Each key should contain an array of objects with the specified structure."
            )

        # Call OpenAI ChatCompletion API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant which can provide assessment of a cyber insurance claim and you can return data strictly in json format"},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )

        # Extract the AI's response
        ai_output = response['choices'][0]['message']['content'].strip()
        print(ai_output)
        return jsonify({"status": "success", "output": ai_output}), 200
    except Exception as e:
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/classify-documents', methods=['POST'])
def classify_documents():
    try:
        # Get JSON input from the request
        json_data = request.json
        prompt = """""You are an intelligent assistant tasked with analyzing and classifying documents related to a cyber insurance claim. You will receive a JSON object as input, where each document will have attributes file_name  and content. Your goal is to:
        1.	Classify each document based on its content or purpose. Use categories like "Incident Report," "Forensic Analysis," "Policy Document," "Claim Form," "Communication Record," "Proof of Loss," "Evidence Document," etc.
        2.	Provide a simple, concise description of what the document contains or represents.
        3.	Return the output in a structured JSON format.
        Here is the input JSON object you will receive:"""+ json.dumps(json_data)+"""You should return a structured JSON object in the format which should have the following classification ‘DocumentName’,’ Classification’ and ‘Description’.The json root object should be 'data'."""


        # Call OpenAI ChatCompletion API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant which return data strictly in json format"},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )

        # Extract the AI's response
        ai_output = response['choices'][0]['message']['content'].strip()
        print(ai_output)
        return jsonify({"status": "success", "output": ai_output}), 200
    except Exception as e:
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

# OCR and Metadata Extraction Functions
def extract_text_from_image(image_path):
    """Extract text from image using OCR."""
    try:
        text = image_to_string(image_path)
        return text
    except Exception as e:
        return str(e)

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return str(e)

def extract_text_from_docx(docx_path):
    """Extract text from a DOCX file."""
    try:
        doc = Document(docx_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        return str(e)

def extract_metadata(file_path):
    """Extract basic file metadata."""
    try:
        creation_date = datetime.fromtimestamp(os.path.getctime(file_path)).strftime("%Y-%m-%d")
        modification_date = datetime.fromtimestamp(os.path.getmtime(file_path)).strftime("%Y-%m-%d")
        file_format = file_path.split('.')[-1]
        return {
            "creation_date": creation_date,
            "modification_date": modification_date,
            "file_format": file_format
        }
    except Exception as e:
        return {"error": str(e)}

# OpenAI GPT-4 Fraud Detection
def analyze_document_with_openai(document_details):
    """Analyze the document for fraud detection using OpenAI."""
    prompt = f"""
    You are an expert in fraud detection for documents which are submitted for a cyber insurance claim. Analyze the following document details for inconsistencies, anomalies, or patterns that may indicate fraud. Provide an assessment as:
    - Fraudulent: Explain why it appears fraudulent.
    - Likely Genuine: Explain why it seems legitimate.
    - Uncertain: Specify additional information needed for a conclusive assessment.
    Provide the response strictly in the json format which should have the following 'Title', 'SubmissionDate', 'ContentSummary','Metadata','Assessment','Reasoning','Conclusion'.The json root object should be 'data' and the response should not have any additional text."


    Document Details:
    - Title: {document_details.get('title')}
    - Submission Date: {document_details.get('submission_date')}
    - Content Summary: {document_details.get('content_summary')}
    - Metadata:
      - Creation Date: {document_details['metadata'].get('creation_date')}
      - Last Modified Date: {document_details['metadata'].get('modification_date')}
      - File Format: {document_details['metadata'].get('file_format')}

    Provide the JSON response without any additional text, strictly adhering to the format.
    """
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an AI fraud detection assistant."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        return str(e)

# API Routes
@app.route('/analyze', methods=['POST'])
def analyze_document():
    """API endpoint to analyze a document for fraud detection."""
    try:
        file = request.files.get('file')  # File is sent with the key "file"
        print("File:", file.filename)
        claim_number = request.form.get('claimNumber')
        print("Claim Number:", claim_number)

        file_path = f"./ClaimDocuments/{claim_number}/{file.filename}"
        # file.save(file_path)

        # Extract metadata
        metadata = extract_metadata(file_path)

        # Extract text based on file type
        file_type = metadata.get("file_format")
        if file_type == "pdf":
            text = extract_text_from_pdf(file_path)
        elif file_type in ["png", "jpg", "jpeg"]:
            text = extract_text_from_image(file_path)
        elif file_type == "docx":
            text = extract_text_from_docx(file_path)
        else:
            return jsonify({"error": f"Unsupported file type: {file_type}"}), 400

        # Prepare document details
        document_details = {
            "title": request.form.get('title', 'Untitled Document'),
            "submission_date": request.form.get('submission_date', datetime.now().strftime("%Y-%m-%d")),
            "content_summary": text[:500],  # First 500 characters of the text as a summary
            "metadata": metadata
        }

        # Analyze with OpenAI
        assessment = analyze_document_with_openai(document_details)
        print('Assessment:', assessment)
        print('end')
        return jsonify({"metadata": metadata, "assessment": assessment})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API route to get user details by UserId
@app.route('/api/users/<int:userId>', methods=['GET'])
def get_user_details(userId):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
             SELECT u."UserId", u."Username", u."Password", u."SecurityAnswer", u."FirstName", u."LastName", u."Email", sq."question"
            FROM "Users" u
            LEFT JOIN "securityquestions" sq ON u."securityquestionid" = sq."questionid"
            WHERE u."UserId" = %s
        ''', (userId,))
        user = cursor.fetchone()
        if user:
            user_details = {
                'UserId': user[0],
                'Username': user[1],
                'Password': user[2],
                'SecurityAnswer': user[3],
                'FirstName': user[4],
                'LastName': user[5],
                'Email': user[6],
                'SecurityQuestion': user[7]
            }
            return jsonify(user_details)
        else:
            return jsonify({"message": "User not found"}), 404
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching user details", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/users', methods=['GET'])
def get_users():
    conn = config.get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT "UserId","Username","FirstName","LastName","Email" FROM "Users"')
        users = cursor.fetchall()
        users_list = [
            {
                'UserId': user[0],
                'Username': user[1],
                'FirstName': user[2],
                'LastName': user[3],
                'Email': user[4],
            }
            for user in users
        ]
        return jsonify(users_list)
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching users", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Endpoint to get devices by policy number
@app.route('/api/devices/<policy_number>', methods=['GET'])
def get_devices_by_policy(policy_number):
    try:
        # Connect to the database
        conn = config.get_db_connection()
        cursor = conn.cursor()
        
        # Execute query
        query = """
            SELECT 
                d."DeviceID", 
                d."Make", 
                d."Model", 
                dt."DeviceType"
            FROM 
                public."Devices" d
            JOIN 
                public."DeviceTypes" dt
            ON 
                d."DeviceTypeID" = dt."ID"
            WHERE 
                d."PolicyNumber" = %s;
        """
        cursor.execute(query, (policy_number,))
        devices = cursor.fetchall()
        
        # Close connections
        cursor.close()
        conn.close()
         # Convert fault ratings to a JSON format
        devices_list = [{"DeviceID": row[0], "Make": row[1], "Model": row[2], "DeviceType": row[3]} for row in devices]
        
        return jsonify(devices_list)
    except Exception as e:
        print('Error fetching devices:', str(e))
        return jsonify({'error': 'Failed to fetch devices'}), 500
    
@app.route('/api/create-claim', methods=['POST'])
def create_claim():
    # Initialize attachments to ensure it's always defined
    attachments = request.files.getlist('attachments') if 'attachments' in request.files else []

    data = request.form
    # Extract only the filenames of the attachments for use in the database
    attachment_filenames = [file.filename for file in attachments]

    # Extract other fields
    policy_number = data.get('policy_number')
    incident_discovery_date = data.get('incident_discovery_date')
    reported_by = data.get('reported_by')
    reported_via = data.get('reported_via')
    claimant = data.get('claimant')
    incident_description = data.get('incident_description')
    incident_location = data.get('incident_location')
    incident_date = data.get('incident_date')
    incident_type_id = data.get('incident_type_id')
    incident_subtype_id = data.get('incident_subtype_id')
    fault_rating = data.get('fault_rating')
    contact_name = data.get('contact_name')
    contact_phone_number = data.get('contact_phone_number')
    contact_email = data.get('contact_email')
    contact_address = data.get('contact_address')
    contact_pincode = data.get('contact_pincode')
    sessionUser = data.get('sessionUser')  # Username or unique identifier for the user
    print(sessionUser)

    try:
        conn = config.get_db_connection()
        cur = conn.cursor()

        # Fetch UserId based on sessionUser (username)
        cur.execute('''
            SELECT "UserId" FROM "Users" WHERE "Username" = %s
        ''', (sessionUser,))
        user_id_result = cur.fetchone()

        if not user_id_result:
            return jsonify({"error": "Invalid session user. User not found."}), 400

        user_id = user_id_result[0]

        # Execute the stored procedure
        cur.execute("""
            SELECT save_claim(
                %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s
            );
        """, (
            policy_number, incident_discovery_date, reported_by, reported_via,
            ','.join(attachment_filenames),  # Pass filenames as a comma-separated string
            claimant, incident_description, incident_location, incident_discovery_date,
            incident_type_id, incident_subtype_id, fault_rating, contact_name,
            contact_phone_number, contact_email, contact_address, contact_pincode
        ))

        # Fetch the returned claim number
        result = cur.fetchone()

        if result and len(result) > 0:
            claim_number = str(result[0])
            print(f"Generated Claim Number: {claim_number}")

            # Insert into UserClaims table
            cur.execute('''
                INSERT INTO "UserClaims" ("UserId", "ClaimNumber")
                VALUES (%s, %s)
            ''', (user_id, claim_number))

            # Commit transaction
            conn.commit()

            # Process attachments
            filenames = []
            claim_folder = os.path.join(app.config['UPLOAD_FOLDER'], claim_number)
            os.makedirs(claim_folder, exist_ok=True)

            if attachments:
                for file in attachments:
                    filename = file.filename
                    file.save(os.path.join(claim_folder, filename))
                    filenames.append(filename)
            else:
                print('No attachments found in request.files')

            # Additional steps (e.g., update reserves, history, etc.)
            incident_type = map_incident_type(incident_type_id)
            reserves_amount = calculate_reserves(incident_type)
            coverage_code = 'Default Coverage'

            # Insert into Coverages table
            cur.execute('''
                INSERT INTO "Coverages" ("CoverageCode")
                VALUES (%s)
                ON CONFLICT ("CoverageCode") DO NOTHING
            ''', (coverage_code,))

            # Insert into Reserves table
            cur.execute('''
                INSERT INTO "Reserves" ("ReserveAmount", "ClaimNumber", "CoverageCode")
                VALUES (%s, %s, %s)
            ''', (reserves_amount, claim_number, coverage_code))

            # Update history
            historyUpdateStatus = update_history('Claim created', 'Creation', claim_number, sessionUser)
            print(historyUpdateStatus)

            conn.commit()
            cur.close()
            conn.close()
            return jsonify({"message": "Claim created successfully", "claim_number": claim_number}), 200

        else:
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({"error": "No claim number returned from the database"}), 500

    except Exception as e:
        print(f"Error during claim creation: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/create-vocal-claim', methods=['POST'])
def create_vocal_claim():
    try:
        # Initialize variables
        attachments = []
        attachment_filenames = []

        # Check the content type of the request
        if request.content_type == 'application/json':
            # Extract data from JSON payload
            claim_data = request.json
            policy_number = claim_data.get('policy_number')
            incident_discovery_date = claim_data.get('incident_discovery_date')
            reported_by = claim_data.get('reported_by')
            reported_via = claim_data.get('reported_via')
            claimant = claim_data.get('claimant')
            incident_description = claim_data.get('incident_description')
            incident_location = claim_data.get('incident_location')
            incident_date = claim_data.get('incident_date')
            incident_type_id = claim_data.get('incident_type_id')
            incident_subtype_id = claim_data.get('incident_subtype_id')
            fault_rating = claim_data.get('fault_rating')
            contact_name = claim_data.get('contact_name')
            contact_phone_number = claim_data.get('contact_phone_number')
            contact_email = claim_data.get('contact_email')
            contact_address = claim_data.get('contact_address')
            contact_pincode = claim_data.get('contact_pincode')
            sessionUser = claim_data.get('sessionUser')
        else:
            # Extract data from form data
            attachments = request.files.getlist('attachments') if 'attachments' in request.files else []
            data = request.form
            attachment_filenames = [file.filename for file in attachments]
            policy_number = data.get('policy_number')
            incident_discovery_date = data.get('incident_discovery_date')
            reported_by = data.get('reported_by')
            reported_via = data.get('reported_via')
            claimant = data.get('claimant')
            incident_description = data.get('incident_description')
            incident_location = data.get('incident_location')
            incident_date = data.get('incident_date')
            incident_type_id = data.get('incident_type_id')
            incident_subtype_id = data.get('incident_subtype_id')
            fault_rating = data.get('fault_rating')
            contact_name = data.get('contact_name')
            contact_phone_number = data.get('contact_phone_number')
            contact_email = data.get('contact_email')
            contact_address = data.get('contact_address')
            contact_pincode = data.get('contact_pincode')
            sessionUser = data.get('sessionUser')

        print(sessionUser)

        conn = config.get_db_connection()
        cur = conn.cursor()

        # Fetch UserId based on sessionUser (username)
        cur.execute('''
            SELECT "UserId" FROM "Users" WHERE "Username" = %s
        ''', (sessionUser,))
        user_id_result = cur.fetchone()

        if not user_id_result:
            return jsonify({"error": "Invalid session user. User not found."}), 400

        user_id = user_id_result[0]

        # Execute the stored procedure
        cur.execute("""
            SELECT save_claim(
                %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s
            );
        """, (
            policy_number, incident_discovery_date, reported_by, reported_via,
            ','.join(attachment_filenames),  # Pass filenames as a comma-separated string
            claimant, incident_description, incident_location, incident_date,
            incident_type_id, incident_subtype_id, fault_rating, contact_name,
            contact_phone_number, contact_email, contact_address, contact_pincode
        ))

        # Fetch the generated claim number
        result = cur.fetchone()
        if result and len(result) > 0:
            claim_number = str(result[0])
            print(f"Generated Claim Number: {claim_number}")

            # Insert into UserClaims table
            cur.execute('''
                INSERT INTO "UserClaims" ("UserId", "ClaimNumber")
                VALUES (%s, %s)
            ''', (user_id, claim_number))

            # Commit transaction
            conn.commit()

            # Process attachments
            # filenames = []
            # claim_folder = os.path.join(app.config['UPLOAD_FOLDER'], claim_number)
            # os.makedirs(claim_folder, exist_ok=True)

            # if attachments:
            #     for file in attachments:
            #         filename = file.filename
            #         file.save(os.path.join(claim_folder, filename))
            #         filenames.append(filename)
            # else:
            #     print('No attachments found in request.files')

            # Additional steps (e.g., update reserves, history, etc.)
            # incident_type = map_incident_type(incident_type_id)
            # reserves_amount = calculate_reserves(incident_type)
            # coverage_code = 'Default Coverage'

            # Insert into Coverages table
            # cur.execute('''
            #     INSERT INTO "Coverages" ("CoverageCode")
            #     VALUES (%s)
            #     ON CONFLICT ("CoverageCode") DO NOTHING
            # ''', (coverage_code,))

            # Insert into Reserves table
            # cur.execute('''
            #     INSERT INTO "Reserves" ("ReserveAmount", "ClaimNumber", "CoverageCode")
            #     VALUES (%s, %s, %s)
            # ''', (reserves_amount, claim_number, coverage_code))

            # Update history
            historyUpdateStatus = update_history('Claim created', 'Creation', claim_number, sessionUser)
            print(historyUpdateStatus)

            conn.commit()
            cur.close()
            conn.close()
            return jsonify({"message": "Claim created successfully", "claim_number": claim_number}), 200

        else:
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({"error": "No claim number returned from the database"}), 500

    except Exception as e:
        app.logger.error(f"Error creating claim: {e}")
        return jsonify({"status": "error", "message": "An internal error occurred"}), 500


def calculate_reserves(incident_type):
    # Example logic to calculate reserves based on incident type
    reserves_mapping = {
        'Ransomware Attack': 10000,
        'Malware': 5000,
        'Phishing': 3000,
        'Online Fraud': 7000,
        'Unauthorised Transactions': 8000,
        'Data Breach': 15000,
    }
    return reserves_mapping.get(incident_type, 2000)  # Default to 2000 if incident type is not found

def map_incident_type(incident_type_id):
    # Mock mapping from incident_type_id to incident type string
    incident_type_mapping = {
        1: 'Ransomware Attack',
        2: 'Malware',
        3: 'Phishing',
        4: 'Online Fraud',
        5: 'Unauthorised Transactions',
        6: 'Data Breach',
    }
    return incident_type_mapping.get(int(incident_type_id), 'Unknown Incident')

@app.route('/api/policy_incidents/<policy_number>', methods=['GET'])
def get_incidents(policy_number):
    print(policy_number)
    conn = config.get_db_connection()
    cur = conn.cursor()
    
    # Query to fetch IncidentTypes with their corresponding IncidentSubTypes
    query = """
    SELECT 
    it."IncidentTypeID",
    it."IncidentType",
    ist."IncidentSubTypeID",
    ist."IncidentSubType"
    FROM 
        public."Coverages" c
    JOIN 
        public."IncidentTypes" it ON c."IncidentTypeID" = it."IncidentTypeID"
    LEFT JOIN 
        public."IncidentSubTypes" ist ON it."IncidentTypeID" = ist."IncidentTypeID"
    WHERE 
        c."PolicyNumber" = %s  -- Replace 'P001' with the desired PolicyNumber
    ORDER BY 
        it."IncidentTypeID";
    """
    
    cur.execute(query, (policy_number,))
    result = cur.fetchall()
    
    # Structuring the data
    incidents = {}
    for row in result:
        type_id, type_name, subtype_id, subtype_name = row
        if type_id not in incidents:
            incidents[type_id] = {
                'IncidentType': type_name,
                'IncidentSubTypes': []
            }
        if subtype_id:
            incidents[type_id]['IncidentSubTypes'].append({
                'IncidentSubTypeID': subtype_id,
                'IncidentSubType': subtype_name
            })

    cur.close()
    conn.close()

    return jsonify(incidents)

# API route to get fault ratings
@app.route('/api/fault-ratings', methods=['GET'])
def get_fault_ratings():
    conn = config.get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT "FaultRatingID", "FaultRating" FROM public."FaultRatings";')
    fault_ratings = cur.fetchall()
    cur.close()
    conn.close()

    # Convert fault ratings to a JSON format
    fault_ratings_list = [{"id": row[0], "value": row[1], "label": row[1]} for row in fault_ratings]

    return jsonify(fault_ratings_list)

@app.route('/api/device-types', methods=['GET'])
def get_device_types():
    try:
        conn = config.get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT "ID", "DeviceType" FROM public."DeviceTypes"')
        device_types = cur.fetchall()
        cur.close()
        conn.close()

        device_types_list = [{"ID": dt[0], "DeviceType": dt[1]} for dt in device_types]
        return jsonify(device_types_list), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/claim-incident-dates/<claimNumber>', methods=['GET'])
def get_claim_and_incident_dates(claimNumber):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    try:
        # Query to get IncidentDiscoveryDate and Attachments from the Claims table
        cursor.execute('SELECT "IncidentDiscoveryDate", "Attachments" FROM public."Claims" WHERE "ClaimNumber" = %s', (claimNumber,))
        claim_data = cursor.fetchone()

        # Query to get IncidentDate from the Incidents table
        cursor.execute('SELECT "IncidentDate" FROM public."Incidents" WHERE "ClaimNumber" = %s', (claimNumber,))
        incident_date = cursor.fetchone()

        if claim_data or incident_date:
            response = {
                "ClaimNumber": claimNumber,
                "IncidentDiscoveryDate": claim_data[0] if claim_data else None,
                "Attachments": claim_data[1] if claim_data else None,
                "IncidentDate": incident_date[0] if incident_date else None
            }
            print(response)
            return jsonify(response), 200
        else:
            return jsonify({"message": "No matching claim or incident found"}), 404
    except Exception as e:
        print(f"Error fetching dates: {e}")
        return jsonify({"message": "Error fetching claim and incident dates", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/search-users', methods=['GET'])
def search_users():
    search_term = request.args.get('query')
    if not search_term:
        return jsonify({"error": "Search term (email) is required"}), 400

    conn = config.get_db_connection()
    cursor = conn.cursor()

    try:
        query = """
        SELECT "UserId", "Username", "FirstName", "LastName", "Email"
        FROM public."Users"
        WHERE "Email" ILIKE %s
        """
        cursor.execute(query, (f"%{search_term}%",))
        users = cursor.fetchall()

        if not users:
            return jsonify({"message": "No users found with that email"}), 404

        return jsonify({"users": users}), 200
    except Exception as e:
        print(f"Error searching users: {e}")
        return jsonify({"error": "An error occurred while searching for users"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/assign-claim', methods=['POST'])
def assign_claim():
    data = request.json
    user_id = data.get('userId')
    claim_number = data.get('claimNumber')

    if not user_id or not claim_number:
        return jsonify({"error": "Both userId and claimNumber are required"}), 400

    conn = config.get_db_connection()
    cur = conn.cursor()

    try:
        # Insert the relationship into the UserClaims table
        insert_query = """
        INSERT INTO public."UserClaims" ("UserId", "ClaimNumber")
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
        """
        cur.execute(insert_query, (user_id, claim_number))
        conn.commit()

        return jsonify({"message": f"Claim {claim_number} assigned to user ID {user_id}"}), 200
    except Exception as e:
        print(f"Error assigning claim: {e}")
        conn.rollback()
        return jsonify({"error": "An error occurred while assigning the claim"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/create_payment', methods=['POST'])
def create_payment():
    data = request.get_json()
    claim_number = data['claim_number']
    check_amount = Decimal(data['check_amount'])  # Convert check_amount to Decimal
    payee_name = data['payee_name']
    account_number = data['account_number']
    ifsc_code = data['ifsc_code']
    upi_id = data['upi_id']
    document_id = data['document_id']
    bank_name = data['bank_name']
    branch_location = data['branch_location']
    mmid = data['mmid']
    contact = data['contact']
    sessionUser = data['sessionUser']

    conn = config.get_db_connection()
    cursor = conn.cursor()

    try:
        # Fetch the current reserve amount for the claim
        cursor.execute('SELECT "ReserveAmount" FROM public."Reserves" WHERE "ClaimNumber" = %s', (claim_number,))
        reserve_result = cursor.fetchone()
        if reserve_result is None:
            print(f"No reserve amount found for claim number: {claim_number}")
            return jsonify({"error": "No reserve amount found for the claim"}), 400
        reserve_amount = reserve_result[0]

        print(f"Reserve Amount: {reserve_amount}")
        print(f"Check Amount: {check_amount}")

        if check_amount > reserve_amount:
            return jsonify({"error": "Payment amount exceeds the reserve amount"}), 400

        # Insert the payment into the Payments table
        insert_query = """
        INSERT INTO public."Payments" ("PayeeName", "CheckAmount", "AccountNumber", "IFSCCode", "UPIID", "DocumentID", "BankName", "BranchLocation", "MMID", "Contact", "ClaimNumber", "Status")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending')
        RETURNING "PaymentID";
        """
        cursor.execute(insert_query, (payee_name, check_amount, account_number, ifsc_code, upi_id, document_id, bank_name, branch_location, mmid, contact, claim_number))
        payment_id = cursor.fetchone()[0]
        conn.commit()

        # Update the reserve amount
        new_reserve_amount = reserve_amount - check_amount
        cursor.execute('UPDATE public."Reserves" SET "ReserveAmount" = %s WHERE "ClaimNumber" = %s', (new_reserve_amount, claim_number))
        conn.commit()
        historyUpdateStatus = update_history('New payment created', 'Payment Creation', claim_number, sessionUser)
        print(historyUpdateStatus)

        return jsonify({"message": "Payment created successfully", "payment_id": payment_id}), 201
    except Exception as e:
        print(f"Error creating payment: {e}")
        conn.rollback()
        return jsonify({"error": "An error occurred while creating the payment"}), 500
    finally:
        cursor.close()
        conn.close()

def update_history(Description, Type, ClaimNumber, username):
    conn = config.get_db_connection()
    cursor = conn.cursor()
    
    print(username)
    try:
        cursor.execute('''
           INSERT INTO "History" ("User", "EventTimestamp", "Description", "Type", "ClaimNumber")
            VALUES (%s, %s, %s, %s, %s)
        ''', (username, datetime.now(), Description, Type, ClaimNumber))
        conn.commit()
        return "History created successfully", 201
    except Exception as e:
        print(e)
        return "Error creating history", 500
    finally:
        cursor.close()
        conn.close()
   
@app.route('/api/update_payment_status', methods=['POST'])
def update_payment_status():
    data = request.get_json()
    payment_id = data['payment_id']
    status = data['status']
    print(status)
    # Ensure the status is one of the allowed values
    if status not in ['Pending', 'Approved', 'Rejected']:
        return jsonify({"error": "Invalid status"}), 400

    conn = config.get_db_connection()
    cursor = conn.cursor()

    try:
        # Fetch the payment details
        cursor.execute('SELECT "CheckAmount", "ClaimNumber", "Status" FROM public."Payments" WHERE "PaymentID" = %s', (payment_id,))
        payment_details = cursor.fetchone()
        if not payment_details:
            return jsonify({"error": "Payment not found"}), 404

        check_amount = payment_details[0]
        claim_number = payment_details[1]
        current_status = payment_details[2]

        # If the payment is already approved or rejected, return an error message
        if current_status in ['Approved', 'Rejected']:
            return jsonify({"error": f"Payment has already been {current_status.lower()}"}), 400

        # Update the payment status
        update_query = 'UPDATE public."Payments" SET "Status" = %s WHERE "PaymentID" = %s'
        cursor.execute(update_query, (status, payment_id))
        conn.commit()

        # If the payment is rejected, add the amount back to the reserve
        if status == 'Rejected':
            cursor.execute('SELECT "ReserveAmount" FROM public."Reserves" WHERE "ClaimNumber" = %s', (claim_number,))
            reserve_result = cursor.fetchone()
            if reserve_result:
                reserve_amount = reserve_result[0]
                new_reserve_amount = reserve_amount + check_amount
                cursor.execute('UPDATE public."Reserves" SET "ReserveAmount" = %s WHERE "ClaimNumber" = %s', (new_reserve_amount, claim_number))
                conn.commit()

        return jsonify({"message": f"Payment status updated to {status}"}), 200
    except Exception as e:
        print(f"Error updating payment status: {e}")
        conn.rollback()
        return jsonify({"error": "An error occurred while updating the payment status"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/check-fraud', methods=['GET'])
def check_fraud():
    claim_number = request.args.get('claimNumber')
    
    if not claim_number:
        return jsonify({"error": "Claim number is required"}), 400

    try:
        # Connect to the database
        conn = config.get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Fetch contact email for the given claim number
        cursor.execute("""
            SELECT "Email"
            FROM public."Contacts"
            WHERE "ClaimNumber" = %s
        """, (claim_number,))
        contact = cursor.fetchone()

        if not contact or not contact["Email"]:
            return jsonify({"message": "No contact details or email found for the given claim number"}), 404

        # Check if the email exists in the FraudContacts table
        cursor.execute("""
            SELECT 1
            FROM public.fraudcontacts
            WHERE "Email" = %s
        """, (contact["Email"],))
        is_fraud = cursor.fetchone()

        # Prepare the response
        result = {
            "ClaimNumber": claim_number,
            "Email": contact["Email"],
            "IsPotentialFraud": bool(is_fraud)
        }

        if is_fraud:
            result["Message"] = "The claim is flagged as potential fraud based on the email."

        return jsonify(result), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            cursor.close()
            conn.close()


@app.route('/check-fraud-rules', methods=['GET'])
def check_fraud_rules():
    claim_number = request.args.get('claimNumber')
    
    if not claim_number:
        return jsonify({"error": "Claim number is required"}), 400

    try:
        # Connect to the database
        conn = config.get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Fetch contact email for the given claim number
        cursor.execute("""
            SELECT "Email"
            FROM public."Contacts"
            WHERE "ClaimNumber" = %s
        """, (claim_number,))
        contact = cursor.fetchone()

        if not contact or not contact["Email"]:
            return jsonify({"message": "No contact details or email found for the given claim number"}), 404

        # Check if the email exists in the FraudContacts table
        cursor.execute("""
            SELECT 1
            FROM public.fraudcontacts
            WHERE "Email" = %s
        """, (contact["Email"],))
        is_fraud = cursor.fetchone()

        # Prepare the response
        result = {
            "ClaimNumber": claim_number,
            "Email": contact["Email"],
            "IsPotentialFraud": bool(is_fraud)
        }

        if is_fraud:
            result["Message"] = "The claim is flagged as potential fraud based on the email."

        return jsonify(result), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            cursor.close()
            conn.close()


@app.route('/api/fraud-check', methods=['POST'])
def fraud_check():
    try:
        # Ensure the request content type is application/json
        if request.content_type != 'application/json':
            return jsonify({"status": "error", "message": "Content-Type must be application/json"}), 415

        # Get the claim data from the request
        claim_data = request.json

        # Structure the prompt for OpenAI with additional business-standard rules
        prompt = f"""
        You are an AI assistant specialized in detecting fraud in cybercrime insurance claims. Analyze the following claim data and determine the likelihood of fraud. Provide a summary of your findings and any suspicious elements.

        Claim Data:
        {json.dumps(claim_data, indent=2)}

        Consider the following business-standard rules in your analysis:
        1. Check for unusually high claim amounts compared to the average claim amount for similar incidents.
        2. Check for frequent claims from the same user within a short period.
        3. Check for inconsistencies in the provided information (e.g., incident date vs. report date).
        4. Check for claims with missing critical information (e.g., missing incident details or documentation).
        5. Check for claims reported from unusual locations or locations known for high fraud rates.
        6. Check for claims with unusual patterns in the description of the incident (e.g., vague or overly detailed descriptions).
        7. Check for claims with discrepancies between the claimed amount and the policy coverage limits.
        8. Check if the email or contact information exists in known fraud databases.
        9. Check for claims with suspicious attachments or documents (e.g., altered or forged documents).
        10. Check for claims with unusual payment methods or details (e.g., multiple payment methods or unusual account details).
        11. Check for claims with a history of previous fraudulent activity.
        12. Check for claims with unusually high repair or replacement costs.
        13. Check for claims with discrepancies in the timeline of events (e.g., delays in reporting the incident).
        14. Check for claims with unusual behavior patterns from the claimant (e.g., aggressive follow-ups or reluctance to provide additional information).
        15. Check for claims with inconsistencies between the claimant's statements and the evidence provided.

        Provide your assessment in JSON format with the following structure:
        {{
            "is_fraudulent": true or false,
            "fraud_probability": 0.0 to 1.0,
            "suspicious_elements": [
                {{
                    "field": "Field Name",
                    "reason": "Explanation of why this field is suspicious"
                }}
            ]
        }}
        """

        # Call the OpenAI API for fraud detection assessment
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an AI assistant skilled in fraud detection for cybercrime insurance claims."},
                {"role": "user", "content": prompt}
            ]
        )
        response_content = response['choices'][0]['message']['content']
        fraud_assessment = json.loads(response_content)

        return jsonify(fraud_assessment), 200

    except ValueError as e:
        app.logger.error(f"Error in fraud check: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    except Exception as e:
        app.logger.error(f"Unexpected error in fraud check: {e}")
        return jsonify({"status": "error", "message": "An internal error occurred"}), 500

@app.route('/api/update_reserve', methods=['POST'])
def update_reserve():
    data = request.get_json()
    claim_number = data['claim_number']
    new_reserve_amount = Decimal(data['new_reserve_amount'])  # Convert new_reserve_amount to Decimal

    conn = config.get_db_connection()
    cursor = conn.cursor()

    try:
        # Fetch the current reserve amount for the specific claim number
        cursor.execute('SELECT "ReserveAmount" FROM public."Reserves" WHERE "ClaimNumber" = %s', (claim_number,))
        reserve_result = cursor.fetchone()
        if reserve_result is None:
            return jsonify({"error": "No reserve amount found for the claim"}), 400
        current_reserve_amount = reserve_result[0]

        # Calculate the updated reserve amount
        updated_reserve_amount = current_reserve_amount + new_reserve_amount

        # Update the reserve amount in the database
        cursor.execute('UPDATE public."Reserves" SET "ReserveAmount" = %s WHERE "ClaimNumber" = %s', (updated_reserve_amount, claim_number))
        conn.commit()

        return jsonify({"message": "Reserve amount updated successfully", "updated_reserve_amount": updated_reserve_amount}), 200
    except Exception as e:
        print(f"Error updating reserve amount: {e}")
        conn.rollback()
        return jsonify({"error": "An error occurred while updating the reserve amount"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/close-claim', methods=['POST'])
def close_claim():
    data = request.json
    claim_number = data.get('claimNumber')
    close_reason = data.get('closeReason')

    if not claim_number or not close_reason:
        return jsonify({'error': 'Missing fields'}), 400

    try:
        conn = config.get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE "Claims"
            SET "Status" = 'Closed', "History" = CONCAT("History", '\nClaim closed: ', NOW(), ' Reason: ', %s)
            WHERE "ClaimNumber" = %s;
        """, (close_reason, claim_number))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({'message': 'Claim closed successfully'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to close the claim'}), 500

@app.route('/api/save-assessment', methods=['POST'])
def save_assessment():
    data = request.json
    assessment = data.get("assessment")
    claim_number = data.get("claimNumber")

    if not assessment or not claim_number:
        return jsonify({"error": "Invalid input. 'assessment' and 'claimNumber' are required."}), 400

    try:
        # Establish a database connection
        conn = config.get_db_connection()
        cursor = conn.cursor()
        # Extract all numbers (integers and decimals)
        estimatedCost = re.findall(r'\d+\.?\d*', assessment.get("Estimated Cost"))
        estimatedCost = [float(x) for x in estimatedCost]
        print(estimatedCost[0]) 

        # Insert data into the 'assessments' table using cursor.execute with parameterized query
        query = """
            INSERT INTO assessments (
                claim_number,
                type_of_assessment,
                responsible_party,
                assessment_focus,
                key_documents,
                key_insights,
                result_summary,
                recommended_next_steps,
                estimated_cost
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            claim_number,
            assessment.get("Type of Assessment"),
            assessment.get("Responsible Party"),
            assessment.get("Assessment Focus"),
            ', '.join(assessment.get("Key Documents", [])),
            assessment.get("Key Insights"),
            assessment.get("Result Summary"),
            assessment.get("Recommended Next Steps"),
            estimatedCost[0]
        )
        cursor.execute(query, params)

        # Commit the transaction and close the connection
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Assessment saved successfully!"}), 200

    except Exception as e:
        print("Error saving assessment:", e)
        return jsonify({"error": "Failed to save assessment."}), 500



if __name__ == "__main__":
    app.run(debug=True)