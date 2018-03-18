import { $$asyncIterator } from "iterall";

export type ResolverFn = (
  rootValue?: any,
  args?: any,
  context?: any,
  info?: any
) => AsyncIterator<any>;

export const withDirectivePublish = (asyncIteratorFn: ResolverFn): ResolverFn => {
         return (rootValue: any, args: any, context: any, info: any): AsyncIterator<any> => {
           const asyncIterator = asyncIteratorFn(rootValue, args, context, info);
           return { next() {
               return asyncIterator.next().then((payload) => {
                 if (context.publish) {
                   context.publish(payload)
                 }
                 return payload;
               });
             }, return() {
               return Promise.resolve({ value: undefined, done: true });
             }, throw(error) {
               return Promise.reject(error);
             }, [$$asyncIterator]() {
               return this;
             } };
         };
       };
