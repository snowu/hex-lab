import { handle } from './feedback.mjs';

export default { fetch: (request, env) => handle(request, env) };
