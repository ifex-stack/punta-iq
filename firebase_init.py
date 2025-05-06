"""
Firebase initialization module for PuntaIQ
Handles authentication with Firebase and provides database references
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, db

def initialize_firebase():
    """Initialize Firebase connection if credentials are available."""
    try:
        # Get Firebase configuration from environment variables
        project_id = 'puntaiq'  # Hardcoded for this project
        private_key = os.environ.get('FIREBASE_PRIVATE_KEY')
        client_email = 'firebase-adminsdk-fbsvc@puntaiq.iam.gserviceaccount.com'
        db_url = os.environ.get('FIREBASE_DB_URL', f'https://{project_id}.firebaseio.com')
        
        if not private_key:
            print("WARNING: FIREBASE_PRIVATE_KEY environment variable is not set.")
            # Check if there's a service account file as fallback
            if os.path.exists('firebase-service-account.json'):
                print("Using firebase-service-account.json file as fallback.")
                cred = credentials.Certificate('firebase-service-account.json')
            else:
                print("No Firebase credentials available.")
                return None
        else:
            # Create credentials dictionary with environment variables
            cred_dict = {
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key.replace('\\n', '\n'),  # Fix escaped newlines if present
                "client_email": client_email,
            }
            cred = credentials.Certificate(cred_dict)
        
        # Initialize the app
        firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': db_url
        })
        
        print("Firebase initialized successfully.")
        return firebase_app
        
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
        return None
        
def get_db_reference(path):
    """
    Get a reference to a specific path in the Firebase database.
    
    Args:
        path (str): The path to the database location
        
    Returns:
        Reference: Firebase database reference or None if initialization failed
    """
    try:
        return db.reference(path)
    except Exception as e:
        print(f"Error getting database reference for path '{path}': {str(e)}")
        return None

# Initialize Firebase when this module is imported
app = initialize_firebase()