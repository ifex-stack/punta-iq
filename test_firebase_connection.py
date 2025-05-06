"""
Test script to verify Firebase connection
"""
import os
import firebase_admin
from firebase_admin import credentials, db

print("Testing Firebase connection...")

# Set the path to the service account file
service_account_path = "firebase-service-account.json"

# Set the Firebase DB URL from environment
firebase_db_url = os.environ.get('FIREBASE_DB_URL')
if not firebase_db_url:
    print("ERROR: FIREBASE_DB_URL environment variable is not set.")
    exit(1)

# Check if the service account file exists
if not os.path.exists(service_account_path):
    print(f"ERROR: Service account file not found at {service_account_path}")
    exit(1)

# Initialize Firebase directly in this script for testing
try:
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