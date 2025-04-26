"""
Storage module for the AI Sports Prediction service.
Handles storing predictions in Firebase Firestore.
"""
import os
import json
import logging
import time
from datetime import datetime, timezone
from config import FIREBASE_INITIALIZED

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
        self.is_initialized = FIREBASE_INITIALIZED
        
        if not self.is_initialized:
            logger.warning("Firebase not initialized. Prediction storage will be unavailable.")
            
            # Create temporary in-memory storage for development
            self.predictions = {}
            self.accumulators = []
        else:
            try:
                # Import Firebase modules
                from firebase_admin import firestore
                
                # Initialize Firestore client
                self.db = firestore.client()
                logger.info("Firestore storage initialized")
            except Exception as e:
                logger.error(f"Error initializing Firestore: {e}")
                self.is_initialized = False
                
                # Create temporary in-memory storage for development
                self.predictions = {}
                self.accumulators = []
    
    def store_predictions(self, predictions, sport):
        """
        Store predictions for a sport in Firestore.
        
        Args:
            predictions (list): List of match predictions
            sport (str): Sport name
            
        Returns:
            bool: True if storage was successful
        """
        if not predictions:
            logger.warning(f"No {sport} predictions to store")
            return True
        
        if not self.is_initialized:
            logger.warning("Firebase not initialized. Storing predictions in memory.")
            self.predictions[sport] = predictions
            return True
        
        try:
            # Import Firebase modules
            from firebase_admin import firestore
            
            # Get predictions collection reference
            predictions_ref = self.db.collection(f"predictions_{sport}")
            
            # Batch write to Firestore
            batch = self.db.batch()
            count = 0
            
            for prediction in predictions:
                # Convert prediction object to Firestore-compatible format
                prediction_data = self._convert_datetime_to_iso(prediction)
                
                # Generate document ID from prediction ID
                doc_id = prediction_data.get("id", f"pred-{int(time.time())}-{count}")
                
                # Add prediction to batch
                doc_ref = predictions_ref.document(doc_id)
                batch.set(doc_ref, prediction_data)
                
                count += 1
            
            # Commit batch
            batch.commit()
            
            logger.info(f"Stored {count} {sport} predictions in Firestore")
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
        if not accumulators:
            logger.warning("No accumulators to store")
            return True
        
        if not self.is_initialized:
            logger.warning("Firebase not initialized. Storing accumulators in memory.")
            self.accumulators = accumulators
            return True
        
        try:
            # Import Firebase modules
            from firebase_admin import firestore
            
            # Get accumulators collection reference
            accumulators_ref = self.db.collection("accumulators")
            
            # Batch write to Firestore
            batch = self.db.batch()
            count = 0
            
            # Flatten accumulators dictionary
            all_accumulators = []
            for acc_type, acc_list in accumulators.items():
                for acc in acc_list:
                    acc["type"] = acc_type
                    all_accumulators.append(acc)
            
            for accumulator in all_accumulators:
                # Convert accumulator object to Firestore-compatible format
                accumulator_data = self._convert_datetime_to_iso(accumulator)
                
                # Generate document ID from accumulator ID
                doc_id = accumulator_data.get("id", f"acca-{int(time.time())}-{count}")
                
                # Add accumulator to batch
                doc_ref = accumulators_ref.document(doc_id)
                batch.set(doc_ref, accumulator_data)
                
                count += 1
            
            # Commit batch
            batch.commit()
            
            logger.info(f"Stored {count} accumulators in Firestore")
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
        if not self.is_initialized:
            logger.warning("Firebase not initialized. Returning in-memory predictions.")
            return self.predictions.get(sport, [])
        
        try:
            # Import Firebase modules
            from firebase_admin import firestore
            
            # Get predictions collection reference
            predictions_ref = self.db.collection(f"predictions_{sport}")
            
            # Get all predictions
            predictions_snapshot = predictions_ref.get()
            
            # Convert to list of dictionaries
            predictions = [doc.to_dict() for doc in predictions_snapshot]
            
            logger.info(f"Retrieved {len(predictions)} {sport} predictions from Firestore")
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
        if not self.is_initialized:
            logger.warning("Firebase not initialized. Returning in-memory accumulators.")
            return self.accumulators
        
        try:
            # Import Firebase modules
            from firebase_admin import firestore
            
            # Get accumulators collection reference
            accumulators_ref = self.db.collection("accumulators")
            
            # Get all accumulators
            accumulators_snapshot = accumulators_ref.get()
            
            # Convert to list of dictionaries
            all_accumulators = [doc.to_dict() for doc in accumulators_snapshot]
            
            # Group by type
            accumulators = {
                "small": [],
                "medium": [],
                "large": [],
                "mega": []
            }
            
            for acc in all_accumulators:
                acc_type = acc.get("type", "small")
                if acc_type in accumulators:
                    accumulators[acc_type].append(acc)
            
            logger.info(f"Retrieved {len(all_accumulators)} accumulators from Firestore")
            return accumulators
            
        except Exception as e:
            logger.error(f"Error getting accumulators: {e}")
            return {
                "small": [],
                "medium": [],
                "large": [],
                "mega": []
            }
    
    def _convert_datetime_to_iso(self, obj):
        """
        Recursively convert datetime objects to ISO strings for JSON serialization.
        
        Args:
            obj: The object to convert
            
        Returns:
            The object with datetime objects converted to ISO strings
        """
        if isinstance(obj, datetime):
            return obj.replace(tzinfo=timezone.utc).isoformat()
        elif isinstance(obj, dict):
            return {k: self._convert_datetime_to_iso(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_datetime_to_iso(item) for item in obj]
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
        if not self.is_initialized:
            logger.warning("Firebase not initialized. Notification not sent.")
            return False
        
        try:
            # Import Firebase modules
            from firebase_admin import messaging
            
            # Send to all users if user_ids is ["all_users"]
            if user_ids == ["all_users"]:
                # Create a message for all users (topic message)
                topic = "predictions"
                
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body
                    ),
                    data=data if data else {},
                    topic=topic
                )
                
                # Send message
                response = messaging.send(message)
                
                logger.info(f"Notification sent to topic '{topic}': {response}")
                return True
            else:
                # Create a multicast message (for specific users)
                message = messaging.MulticastMessage(
                    notification=messaging.Notification(
                        title=title,
                        body=body
                    ),
                    data=data if data else {},
                    tokens=user_ids
                )
                
                # Send message
                response = messaging.send_multicast(message)
                
                logger.info(f"Notification sent to {response.success_count} users (failed: {response.failure_count})")
                return response.success_count > 0
                
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return False