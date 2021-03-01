from chalice import Chalice

from grapl_common.grapl_logger import get_module_grapl_logger

class ApiGatewayService(object):
    def __init__(self, app: Chalice) -> None:
        self.app = app
        self.logger = get_module_grapl_logger()
        if self.logger.getEffectiveLevel() <= 10:
            self.app.debug = True
