import { Request, Response, MiddlewareFunction } from "./types";
import { Router } from "../router/router";

export class Application {
  private middleware: MiddlewareFunction[] = [];
  private router: Router;

  constructor() {
    this.router = new Router();
  }
}
