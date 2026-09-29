let mutation;

export function initialize(data) {
  mutation = data;
}

export async function load(url, context, nextLoad) {
  if (url !== mutation.runtimeUrl) return nextLoad(url, context);
  return {
    format: "module",
    source: mutation.runtimeSource,
    shortCircuit: true,
  };
}
