const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

export async function uploadReceipt<T>(
  expenseId: string,
  file: File,
  token: string,
): Promise<T> {
  const formData = new FormData();

  formData.append("expense", expenseId);
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/receipts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        `Receipt upload failed with status ${response.status}`,
    ) as Error & {
      status?: number;
      data?: unknown;
    };

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data as T;
}