import inspect
import logging
import os
import sys

from typing import cast, Any

def _stdout_already_registered(logger: logging.Logger) -> bool:

    for handler in logger.handlers:
        if not hasattr(handler,'stream'):
            continue
        stream_handler = cast(Any, handler)
        if stream_handler.stream == sys.stdout:
            return True
    return False

def get_module_grapl_logger(default_log_level: str = "ERROR") -> logging.Logger:
    """
    Callers should put
    LOGGER = get_module_grapl_logger()
    at module scope.
    """
    default_log_level = default_log_level or "ERROR"
    caller_stack = inspect.stack()[1]
    caller_module = inspect.getmodule(caller_stack[0])
    assert caller_module
    logger = logging.getLogger(caller_module.__name__)
    logger.setLevel(os.getenv("GRAPL_LOG_LEVEL", default_log_level))
    if not _stdout_already_registered(logger):
        logger.addHandler(logging.StreamHandler(stream=sys.stdout))
    return logger
