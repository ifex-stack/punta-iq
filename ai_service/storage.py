"""
Storage module for the AI Sports Prediction service.
Handles storing predictions in Firebase Firestore.
"""
from datetime import datetime
import json
from config import db, initialize_firebase

class FirestoreStorage:
    """Class to store and retrieve predictions from Firebase Firestore."""
    
    def __init__(self):
        """Initialize the FirestoreStorage."""
        initialize_firebase()
        
    def store_predictions(self, predictions, sport):
        """
        Store predictions for a sport in Firestore.
        
        Args:
            predictions (list): List of match predictions
            sport (str): Sport name
            
        Returns:
            bool: True if storage was successful
        """
        if not db:
            print("Firebase not initialized. Cannot store predictions.")
            return False
        
        try:
            batch = db.batch()
            predictions_ref = db.collection('predictions').document(sport)
            
            # Store the predictions with timestamp
            data = {
                'matches': predictions,
                'updated_at': datetime.now(),
                'count': len(predictions)
            }
            
            batch.set(predictions_ref, data)
            
            # Also store individual matches for easier querying
            for match in predictions:
                match_id = match.get('match_id')
                if match_id:
                    match_ref = db.collection('matches').document(f"{sport}_{match_id}")
                    batch.set(match_ref, {
                        **match,
                        'sport': sport,
                        'updated_at': datetime.now()
                    })
            
            batch.commit()
            print(f"Stored {len(predictions)} {sport} predictions in Firestore")
            return True
            
        except Exception as e:
            print(f"Error storing predictions in Firestore: {e}")
            return False
    
    def store_accumulators(self, accumulators):
        """
        Store accumulator predictions in Firestore.
        
        Args:
            accumulators (dict): Dictionary of accumulator predictions
            
        Returns:
            bool: True if storage was successful
        """
        if not db:
            print("Firebase not initialized. Cannot store accumulators.")
            return False
        
        try:
            accumulators_ref = db.collection('accumulators').document('daily')
            
            # Store the accumulators with timestamp
            data = {
                'accumulators': accumulators,
                'updated_at': datetime.now()
            }
            
            accumulators_ref.set(data)
            print(f"Stored {len(accumulators)} accumulator types in Firestore")
            return True
            
        except Exception as e:
            print(f"Error storing accumulators in Firestore: {e}")
            return False
    
    def get_predictions(self, sport):
        """
        Get predictions for a sport from Firestore.
        
        Args:
            sport (str): Sport name
            
        Returns:
            list: List of match predictions
        """
        if not db:
            print("Firebase not initialized. Cannot get predictions.")
            return []
        
        try:
            predictions_ref = db.collection('predictions').document(sport)
            doc = predictions_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return data.get('matches', [])
            else:
                print(f"No predictions found for {sport}")
                return []
                
        except Exception as e:
            print(f"Error getting predictions from Firestore: {e}")
            return []
    
    def get_accumulators(self):
        """
        Get accumulator predictions from Firestore.
        
        Returns:
            dict: Dictionary of accumulator predictions
        """
        if not db:
            print("Firebase not initialized. Cannot get accumulators.")
            return {}
        
        try:
            accumulators_ref = db.collection('accumulators').document('daily')
            doc = accumulators_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return data.get('accumulators', {})
            else:
                print("No accumulators found")
                return {}
                
        except Exception as e:
            print(f"Error getting accumulators from Firestore: {e}")
            return {}
    
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
        if not db:
            print("Firebase not initialized. Cannot send notification.")
            return False
        
        try:
            # Store the notification in Firestore
            notifications_ref = db.collection('notifications')
            
            notification = {
                'title': title,
                'body': body,
                'data': data or {},
                'user_ids': user_ids,
                'sent_at': datetime.now(),
                'read_by': []
            }
            
            notifications_ref.add(notification)
            
            # In a real implementation, this would use Firebase Cloud Messaging (FCM)
            # to send push notifications to the user's devices
            print(f"Sent notification to {len(user_ids)} users")
            return True
            
        except Exception as e:
            print(f"Error sending notification: {e}")
            return False

# Example usage
if __name__ == "__main__":
    storage = FirestoreStorage()
    # This would store real predictions in a production system