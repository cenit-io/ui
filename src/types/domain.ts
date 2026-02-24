export interface DataTypeSpec {
  id?: string;
  _id?: string;
  namespace?: string;
  name: string;
  title?: string;
  _type?: string;
  schema?: Record<string, unknown>;
  id_type?: string;
  [key: string]: unknown;
}

export interface PropertySpec {
  name: string;
  jsonKey?: string;
  type?: string;
  dataType?: DataTypeSpec;
  propertySchema?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SubjectState {
  key: string;
  type: string;
  dataTypeId?: string;
  id?: string;
  [key: string]: unknown;
}

export interface AuthSession {
  accessToken?: {
    access_token?: string;
    id_token?: string;
    expires_in?: number;
    refresh_token?: string;
    token_type?: string;
    [key: string]: unknown;
  };
  idToken?: {
    email?: string;
    exp?: number;
    iat?: number;
    name?: string;
    preferred_username?: string;
    [key: string]: unknown;
  };
  tenantId?: string;
  userId?: string;
}
