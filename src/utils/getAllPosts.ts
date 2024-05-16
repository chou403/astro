import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { collections } from "../content/config";

const getAllPosts = async () => {
  type CollectionName = keyof typeof collections;
  let posts: CollectionEntry<CollectionName>[] = [];

  for (const collectionName of Object.keys(collections) as CollectionName[]) {
    const collectionItems = await getCollection(collectionName);
    posts = [...posts, ...collectionItems];
  }
  return posts;
};

export default getAllPosts;
