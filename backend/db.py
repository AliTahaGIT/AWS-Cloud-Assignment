import boto3, os
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
BUCKET = os.getenv("S3_BUCKET")

session = boto3.Session(
    aws_access_key_id=os.getenv("aws_access_key_id"),
    aws_secret_access_key=os.getenv("aws_secret_access_key"),
    aws_session_token=os.getenv("aws_session_token"),
    region_name=AWS_REGION
)

dynamodb = session.resource('dynamodb')
s3 = session.client('s3')
posts_table = dynamodb.Table("Posts")
users_table = dynamodb.Table("Users") # Table for storing user credentials (username/pw/email) -Ahmed