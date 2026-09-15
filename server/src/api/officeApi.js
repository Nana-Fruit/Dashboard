// Wrapper around the Office-side upstream API (sales orders, etc). Scaffold
// only for now - office.js still reads local mock fixtures directly. Wire
// routes up to callOfficeApi() once the real Office API is available.

import { config } from "../config.js";
import { createApiClient } from "../lib/apiClient.js";

export const callOfficeApi = createApiClient(config.officeApi);
