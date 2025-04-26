"""
Storage module for the AI Sports Prediction service.
Handles storing predictions in Firebase Firestore.
"""
import logging
import json
import os
from datetime import datetime
from config import initialize_firebase

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('storage')

class FirestoreStorage:
    """Class to store and retrieve predictions from Firebase Firestore."""
    
    def __init__(self):
        """Initialize the FirestoreStorage."""
        self.db = None
        self.initialized = False
        
        try:
            # Try to import Firebase libraries
            import firebase_admin
            from firebase_admin import firestore
            
            # Check if Firebase is already initialized
            try:
                # Get existing app
                firebase_admin.get_app()
                self.initialized = True
            except ValueError:
                # Initialize Firebase if not already initialized
                self.initialized = initialize_firebase()
            
            if self.initialized:
                self.db = firestore.client()
                logger.info("Firestore storage initialized successfully")
            else:
                logger.warning("Firebase not initialized. Storage operations will be disabled.")
                
        except ImportError:
            logger.warning("Firebase libraries not installed. Storage operations will be disabled.")
        except Exception as e:
            logger.error(f"Error initializing Firestore storage: {e}")
    
    def store_predictions(self, predictions, sport):
        """
        Store predictions for a sport in Firestore.
        
        Args:
            predictions (list): List of match predictions
            sport (str): Sport name
            
        Returns:
            bool: True if storage was successful
        """
        if not self.initialized or not self.db:
            logger.warning("Firestore storage not initialized. Cannot store predictions.")
            return False
        
        try:
            # Get a reference to the sport collection
            collection_ref = self.db.collection('predictions').document(sport).collection('matches')
            
            # Batch write for efficiency
            from firebase_admin import firestore
            batch = self.db.batch()
            
            for prediction in predictions:
                # Use the prediction ID as the document ID
                doc_id = str(prediction.get('id', f"unknown-{datetime.now().timestamp()}"))
                doc_ref = collection_ref.document(doc_id)
                
                # Add prediction creation time if not present
                if 'created_at' not in prediction:
                    prediction['created_at'] = datetime.now().isoformat()
                
                # Convert datetime objects to ISO strings for JSON serialization
                prediction_json = self._convert_datetime_to_iso(prediction)
                
                # Add the prediction to the batch
                batch.set(doc_ref, prediction_json, merge=True)
            
            # Commit the batch
            batch.commit()
            
            # Update the last updated timestamp
            self.db.collection('predictions').document('metadata').set({
                'last_updated': firestore.SERVER_TIMESTAMP,
                f'{sport}_count': len(predictions)
            }, merge=True)
            
            logger.info(f"Successfully stored {len(predictions)} {sport} predictions")
            return True
            
        except Exception as e:
            logger.error(f"Error storing {sport} predictions: {e}")
            return False
    
    def store_accumulators(self, accumulators):
        """
        Store accumulator predictions in Firestore.
        
        Args:
            accumulators (dict): Dictionary of accumulator predictions
            
        Returns:
            bool: True if storage was successful
        """
        if not self.initialized or not self.db:
            logger.warning("Firestore storage not initialized. Cannot store accumulators.")
            return False
        
        try:
            # Get a reference to the accumulators collection
            collection_ref = self.db.collection('predictions').document('accumulators')
            
            # Convert datetime objects to ISO strings for JSON serialization
            accumulator_json = self._convert_datetime_to_iso(accumulators)
            
            # Store the accumulators
            collection_ref.set(accumulator_json)
            
            # Update the last updated timestamp
            from firebase_admin import firestore
            self.db.collection('predictions').document('metadata').set({
                'last_updated': firestore.SERVER_TIMESTAMP,
                'accumulators_count': len(accumulators)
            }, merge=True)
            
            logger.info(f"Successfully stored {len(accumulators)} accumulators")
            return True
            
        except Exception as e:
            logger.error(f"Error storing accumulators: {e}")
            return False
    
    def get_predictions(self, sport):
        """
        Get predictions for a sport from Firestore.
        
        Args:
            sport (str): Sport name
            
        Returns:
            list: List of match predictions
        """
        if not self.initialized or not self.db:
            logger.warning("Firestore storage not initialized. Cannot get predictions.")
            return []
        
        try:
            # Get a reference to the sport collection
            collection_ref = self.db.collection('predictions').document(sport).collection('matches')
            
            # Get the most recent predictions (up to 100)
            query = collection_ref.order_by('created_at', direction='DESCENDING').limit(100)
            docs = query.get()
            
            predictions = []
            for doc in docs:
                prediction = doc.to_dict()
                predictions.append(prediction)
            
            logger.info(f"Retrieved {len(predictions)} {sport} predictions")
            return predictions
            
        except Exception as e:
            logger.error(f"Error getting {sport} predictions: {e}")
            return []
    
    def get_accumulators(self):
        """
        Get accumulator predictions from Firestore.
        
        Returns:
            dict: Dictionary of accumulator predictions
        """
        if not self.initialized or not self.db:
            logger.warning("Firestore storage not initialized. Cannot get accumulators.")
            return {}
        
        try:
            # Get a reference to the accumulators document
            doc_ref = self.db.collection('predictions').document('accumulators')
            doc = doc_ref.get()
            
            if doc.exists:
                accumulators = doc.to_dict()
                logger.info(f"Retrieved {len(accumulators)} accumulators")
                return accumulators
            else:
                logger.warning("No accumulators found")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting accumulators: {e}")
            return {}
    
    def _convert_datetime_to_iso(self, obj):
        """
        Recursively convert datetime objects to ISO strings for JSON serialization.
        
        Args:
            obj: The object to convert
            
        Returns:
            The object with datetime objects converted to ISO strings
        """
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: self._convert_datetime_to_iso(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_datetime_to_iso(item) for item in obj]
        else:
            return obj
            
    def send_notification(self, user_ids, title, body, data=None):
        """
        Send a push notification to users.
        
        Args:
            user_ids (list): List of user IDs to notify
            title (str): Notification title
            body (str): Notification body
            data (dict): Additional data for the notification
            
        Returns:
            bool: True if notification was sent successfully
        """
        if not self.initialized:
            logger.warning("Firebase not initialized. Cannot send notifications.")
            return False
        
        try:
            from firebase_admin import messaging
            
            # If all_users is specified, send to a topic instead of individual users
            if user_ids == ["all_users"]:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body
                    ),
                    data=data or {},
                    topic="predictions"  # Topic that all users can subscribe to
                )
                
                response = messaging.send(message)
                logger.info(f"Successfully sent notification to all users: {response}")
                return True
            else:
                # Send to specific users
                messages = []
                for user_id in user_ids:
                    message = messaging.Message(
                        notification=messaging.Notification(
                            title=title,
                            body=body
                        ),
                        data=data or {},
                        token=user_id  # This should be the FCM token, not user ID
                    )
                    messages.append(message)
                
                if messages:
                    response = messaging.send_all(messages)
                    logger.info(f"Successfully sent {response.success_count} notifications to users")
                    if response.failure_count > 0:
                        failures = response.responses
                        logger.warning(f"Failed to send {response.failure_count} notifications: {failures}")
                    
                    return response.success_count > 0
                
                return False
                
        except ImportError:
            logger.warning("Firebase Messaging library not installed. Cannot send notifications.")
            return False
        except Exception as e:
            logger.error(f"Error sending notifications: {e}")
            return False