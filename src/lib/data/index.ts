import { InMemoryRepository } from "./repository";

let repository: InMemoryRepository | undefined;

export function getRepository(): InMemoryRepository {
  if (!repository) {
    repository = new InMemoryRepository();
  }
  return repository;
}

export * from "./repository";
export * from "./seed";
export { getData, resetData } from "./store";
