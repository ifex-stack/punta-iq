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
        # Always use the correct database URL
        db_url = 'https://puntaiq-default-rtdb.firebaseio.com'
        
        # Always use the service account file for simplicity and reliability
        service_account_path = 'firebase-service-account.json'
        
        if not os.path.exists(service_account_path):
            print(f"ERROR: Service account file not found at {service_account_path}")
            return None
            
        print(f"Using Firebase service account file at {service_account_path}")
        cred = credentials.Certificate(service_account_path)
        
        # Initialize the app with the correct database URL
        firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': db_url
        })
        
        print("Firebase initialized successfully with database URL:", db_url)
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