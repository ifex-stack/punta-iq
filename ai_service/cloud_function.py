"""
Cloud function handler for the AI Sports Prediction service.
This module is designed to be deployed as a Google Cloud Function
that runs on a schedule to generate and store predictions.
"""
import datetime
import json
from main import run_prediction_pipeline

def predict_daily(event, context):
    """
    Cloud Function entry point to run the prediction pipeline.
    This function is triggered by a Cloud Scheduler job.
    
    Args:
        event (dict): The Cloud Functions event payload
        context (google.cloud.functions.Context): The Cloud Functions event metadata
        
    Returns:
        dict: Summary of the prediction run
    """
    print(f"Cloud Function trigger received at {datetime.datetime.now().isoformat()}")
    
    try:
        # Run prediction pipeline with default settings (store and notify)
        results = run_prediction_pipeline(days_ahead=3, store_results=True, notify_users=True)
        
        # Log summary
        sports_count = len(results["predictions"])
        total_predictions = sum(len(preds) for sport, preds in results["predictions"].items())
        
        summary = {
            "success": True,
            "timestamp": datetime.datetime.now().isoformat(),
            "sports_processed": sports_count,
            "total_predictions": total_predictions,
            "execution_time": results["execution_time"],
            "accumulators_generated": len(results["accumulators"])
        }
        
        print(f"Prediction pipeline completed successfully: {json.dumps(summary)}")
        return summary
        
    except Exception as e:
        error_summary = {
            "success": False,
            "timestamp": datetime.datetime.now().isoformat(),
            "error": str(e)
        }
        
        print(f"Prediction pipeline failed: {json.dumps(error_summary)}")
        return error_summary