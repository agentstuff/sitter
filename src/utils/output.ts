export function success(data: Record<string, unknown>): void {
  const output = { success: true, ...data };
  console.log(JSON.stringify(output));
}

export function error(code: string, message: string): void {
  const output = { error: code, message };
  console.log(JSON.stringify(output));
}

export function output(data: Record<string, unknown>): void {
  console.log(JSON.stringify(data));
}
