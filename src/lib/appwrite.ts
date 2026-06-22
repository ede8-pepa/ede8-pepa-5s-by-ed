export const appwriteConfig = {
  endpoint:
    process.env.APPWRITE_ENDPOINT ??
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ??
    "https://cloud.appwrite.io/v1",
  projectId:
    process.env.APPWRITE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ??
    "6a3681b00024f77f43af",
  databaseId:
    process.env.APPWRITE_DATABASE_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ??
    "6a3683a20012ce76d15f",
  apiKey: process.env.APPWRITE_API_KEY,
  collections: {
    zones: "zones",
    audits: "audits",
    auditAnswers: "audit_answers",
    correctiveActions: "corrective_actions",
    standards: "standards",
  },
} as const;

export function createAppwriteHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Appwrite-Project": appwriteConfig.projectId,
  };

  if (appwriteConfig.apiKey) {
    headers["X-Appwrite-Key"] = appwriteConfig.apiKey;
  }

  return headers;
}

export function createCollectionUrl(collectionId: string) {
  const endpoint = appwriteConfig.endpoint.replace(/\/$/, "");
  const databaseId = encodeURIComponent(appwriteConfig.databaseId);
  const encodedCollectionId = encodeURIComponent(collectionId);

  return `${endpoint}/databases/${databaseId}/collections/${encodedCollectionId}/documents`;
}

export function createDocumentUrl(collectionId: string, documentId: string) {
  return `${createCollectionUrl(collectionId)}/${encodeURIComponent(documentId)}`;
}

export function createCollectionUrlWithParams(
  collectionId: string,
  params: Record<string, string>,
) {
  const url = new URL(createCollectionUrl(collectionId));

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

export async function createAppwriteSdkConnection() {
  const loadSdk = new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<{
    Client: new () => {
      setEndpoint: (endpoint: string) => unknown;
      setProject: (projectId: string) => unknown;
    };
    Databases: new (client: unknown) => unknown;
  }>;
  const { Client, Databases } = await loadSdk("appwrite");
  const client = new Client();

  client.setEndpoint(appwriteConfig.endpoint);
  client.setProject(appwriteConfig.projectId);

  return {
    client,
    databases: new Databases(client),
  };
}
