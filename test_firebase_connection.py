"""
Test script to verify Firebase connection
"""
import os
import json
import requests
import firebase_admin
import argparse
import subprocess
from firebase_admin import credentials, db

# Parse command-line arguments
parser = argparse.ArgumentParser(description='Test Firebase connection and optionally update .env file')
parser.add_argument('--update-env', action='store_true', help='Update .env file with correct Firebase DB URL')
parser.add_argument('--db-url', default='https://puntaiq-default-rtdb.firebaseio.com', 
                    help='Firebase DB URL to use (default: https://puntaiq-default-rtdb.firebaseio.com)')
args = parser.parse_args()

print("Testing Firebase connection...")

# Set the correct Firebase DB URL
correct_firebase_db_url = args.db_url

# Get current environment variable value
firebase_db_url = os.environ.get('FIREBASE_DB_URL')
print(f"Current FIREBASE_DB_URL from environment: {firebase_db_url}")

# Override environment variable for this session
os.environ['FIREBASE_DB_URL'] = correct_firebase_db_url
print(f"Using Firebase DB URL for this session: {correct_firebase_db_url}")

# Update .env file if requested
if args.update_env:
    try:
        with open('.env', 'r') as f:
            env_content = f.read()
        
        # Check if FIREBASE_DB_URL already exists in .env
        if 'FIREBASE_DB_URL=' in env_content:
            # Replace existing FIREBASE_DB_URL line
            lines = env_content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('FIREBASE_DB_URL='):
                    lines[i] = f'FIREBASE_DB_URL={correct_firebase_db_url}'
                    break
            updated_content = '\n'.join(lines)
        else:
            # Add FIREBASE_DB_URL line if it doesn't exist
            updated_content = env_content.rstrip() + f'\nFIREBASE_DB_URL={correct_firebase_db_url}\n'
        
        # Write updated content back to .env
        with open('.env', 'w') as f:
            f.write(updated_content)
        
        print(f"Successfully updated .env file with FIREBASE_DB_URL={correct_firebase_db_url}")
    except Exception as e:
        print(f"Error updating .env file: {str(e)}")

# Set the path to the service account file
service_account_path = "firebase-service-account.json"

# Check if the service account file exists
if not os.path.exists(service_account_path):
    print(f"ERROR: Service account file not found at {service_account_path}")
    exit(1)
else:
    print(f"Found service account file at {service_account_path}")

# Test direct HTTP connection to the database
try:
    print(f"Testing direct HTTP access to: {correct_firebase_db_url}/.json")
    response = requests.get(f"{correct_firebase_db_url}/.json")
    print(f"HTTP Status: {response.status_code}")
    if response.status_code == 200:
        print("Direct HTTP connection successful")
    else:
        print(f"Direct HTTP connection failed: {response.text}")
except Exception as e:
    print(f"Error testing direct HTTP connection: {str(e)}")

# Initialize Firebase directly in this script for testing
try:
    # Load and display the service account project_id
    with open(service_account_path, 'r') as f:
        service_account_data = json.load(f)
        print(f"Service account project_id: {service_account_data.get('project_id')}")

    cred = credentials.Certificate(service_account_path)
    firebase_app = firebase_admin.initialize_app(cred, {
        'databaseURL': correct_firebase_db_url
    })
    print("Firebase initialized successfully.")
    
    # Try to get a reference to a test path
    test_ref = db.reference("/test")
    print("Successfully got database reference.")
    
    # Try to write some test data
    try:
        test_ref.set({"timestamp": "test_connection"})
        print("Successfully wrote test data to Firebase.")
        
        # Read the test data back
        test_data = test_ref.get()
        print(f"Successfully read test data from Firebase: {test_data}")
        
        # Clean up the test data
        test_ref.delete()
        print("Successfully cleaned up test data.")

        # If everything worked, show instructions for setting env var permanently
        if firebase_db_url != correct_firebase_db_url:
            print("\n======================================")
            print("DATABASE CONNECTION FIXED!")
            print("======================================")
            print("Temporary fix applied only for this session.")
            print("To make this fix permanent, add this line to your .env file:")
            print(f"FIREBASE_DB_URL={correct_firebase_db_url}")
            print("Or run this script with the --update-env flag:")
            print("python test_firebase_connection.py --update-env")
            print("======================================")
        
    except Exception as e:
        print(f"Error writing/reading test data: {str(e)}")
except Exception as e:
    print(f"Error initializing Firebase: {str(e)}")