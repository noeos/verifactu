// SPDX-License-Identifier: Apache-2.0

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if ("value" in descriptor) deepFreeze(descriptor.value);
  }
  return Object.freeze(value);
}
