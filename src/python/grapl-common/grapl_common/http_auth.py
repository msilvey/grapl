import os
import time
from typing import Optional, Dict, Any

import boto3
import jwt


class LazyJwtSecret:
    def __init__(self, jwt_secret_id: str, is_local: bool) -> None:
        self.secret: Optional[str] = None
        self.jwt_secret_id = jwt_secret_id
        self.is_local = is_local

    def get(self) -> str:
        if self.secret is None:
            self.secret = self._retrieve_jwt_secret()
        return self.secret

    def _retrieve_jwt_secret(self) -> str:
        if self.is_local:
            return self._retrieve_jwt_secret_local()
        else:
            jwt_secret_id = os.environ["JWT_SECRET_ID"]

            secretsmanager = boto3.client("secretsmanager")

            jwt_secret: str = secretsmanager.get_secret_value(
                SecretId=jwt_secret_id,
            )["SecretString"]
            return jwt_secret

    def _retrieve_jwt_secret_local(self) -> str:
        # Theory: This whole code block is deprecated by the `wait-for-it grapl-provision`,
        # which guarantees that the JWT Secret is, now, in the secretsmanager. - wimax

        timeout_secs = 30
        jwt_secret: Optional[str] = None

        for _ in range(timeout_secs):
            try:
                secretsmanager = boto3.client(
                    "secretsmanager",
                    region_name="us-east-1",
                    aws_access_key_id="dummy_cred_aws_access_key_id",
                    aws_secret_access_key="dummy_cred_aws_secret_access_key",
                    endpoint_url="http://secretsmanager.us-east-1.amazonaws.com:4584",
                )

                jwt_secret = secretsmanager.get_secret_value(
                    SecretId="JWT_SECRET_ID",
                )["SecretString"]
                break
            except Exception as e:
                LOGGER.debug(e)
                time.sleep(1)
        if not jwt_secret:
            raise TimeoutError(
                f"Expected secretsmanager to be available within {timeout_secs} seconds"
            )
        return jwt_secret




    def check_jwt(headers: Dict[str, Any]) -> bool:
        encoded_jwt = None
        for cookie in headers.get("Cookie", "").split(";"):
            if "grapl_jwt=" in cookie:
                encoded_jwt = cookie.split("grapl_jwt=")[1].strip()

        if not encoded_jwt:
            LOGGER.info("encoded_jwt %s", encoded_jwt)
            return False

        try:
            jwt.decode(encoded_jwt, self.get(), algorithms=["HS256"])
            return True
        except Exception as e:
            LOGGER.error("jwt.decode %s", e)
            return False
