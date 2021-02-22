from typing import TypeVar, Callable, Optional, Union, Dict, Any

from chalice import Chalice, Response

RouteFn = TypeVar("RouteFn", bound=Callable[..., Response])

# Sometimes we pass in a dict. Sometimes we pass the string "True". Weird.
Res = Union[Dict[str, Any], str]


class App(object):
    def __init__(self, app_name: str, is_local: bool) -> None:
        self.app = Chalice(app_name=app_name)
        self.is_local = is_local

    def requires_auth(self, path: str) -> Callable[[RouteFn], RouteFn]:
        if not self.is_local:
            path = "/{proxy+}" + path

        def route_wrapper(route_fn: RouteFn) -> RouteFn:
            @self.app.route(path, methods=["OPTIONS", "GET", "POST"])
            def inner_route() -> Response:
                if self.app.current_request.method == "OPTIONS":
                    return respond(None, {})

                if not check_jwt(self.app.current_request.headers):
                    LOGGER.warning("not logged in")
                    return respond("Must log in", status_code=403)
                try:
                    return route_fn()
                except Exception as e:
                    LOGGER.error(e)
                    return respond("Unexpected Error")

            return cast(RouteFn, inner_route)

        return route_wrapper


    def no_auth(self, path: str) -> Callable[[RouteFn], RouteFn]:
        if not self.is_local:
            path = "/{proxy+}" + path

        def route_wrapper(route_fn: RouteFn) -> RouteFn:
            @self.app.route(path, methods=["OPTIONS", "GET", "POST"])
            def inner_route() -> Response:
                if app.current_request.method == "OPTIONS":
                    return respond(None, {})
                try:
                    return route_fn()
                except Exception as e:
                    LOGGER.error(f"path {path} had an error: {e}")
                    return respond("Unexpected Error")

            return cast(RouteFn, inner_route)

        return route_wrapper


def respond(
        err: Optional[str],
        res: Optional[Res] = None,
        headers: Optional[Dict[str, Any]] = None,
        status_code: int = 500,
) -> Response:
    if not headers:
        headers = {}
    if self.is_local:
        override = app.current_request.headers.get("origin", "")
        LOGGER.warning(f"overriding origin: {override}")
        headers = {"Access-Control-Allow-Origin": override, **headers}
    return Response(
        body={"error": err} if err else json.dumps({"success": res}),
        status_code=status_code if err else 200,
        headers={
            "Access-Control-Allow-Credentials": "true",
            "Content-Type": "application/json",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "X-Requested-With": "*",
            "Access-Control-Allow-Headers": ":authority, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
            **headers,
        },
    )
