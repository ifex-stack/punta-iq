"""
Test script to verify Firebase connection
"""
import os
import json
import requests
import firebase_admin
from firebase_admin import credentials, db

print("Testing Firebase connection...")

# Set the path to the service account file
service_account_path = "firebase-service-account.json"

# Set the Firebase DB URL from environment
firebase_db_url = os.environ.get('FIREBASE_DB_URL')
print(f"Using Firebase DB URL: {firebase_db_url}")

if not firebase_db_url:
    print("ERROR: FIREBASE_DB_URL environment variable is not set.")
    exit(1)

# Check if the service account file exists
if not os.path.exists(service_account_path):
    print(f"ERROR: Service account file not found at {service_account_path}")
    exit(1)
else:
    print(f"Found service account file at {service_account_path}")

# Test direct HTTP connection to the database
try:
    print(f"Testing direct HTTP access to: {firebase_db_url}/.json")
    response = requests.get(f"{firebase_db_url}/.json")
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
        'databaseURL': firebase_db_url
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
        
    except Exception as e:
        print(f"Error writing/reading test data: {str(e)}")
except Exception as e:
    print(f"Error initializing Firebase: {str(e)}")