/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/customers` | `/(tabs)/financial` | `/(tabs)/inventory` | `/(tabs)/more` | `/(tabs)/orders` | `/(tabs)/products` | `/(tabs)/settings` | `/_sitemap` | `/ai-chat` | `/auth` | `/auth/oauth` | `/business-onboarding` | `/business-profile` | `/customers` | `/financial` | `/inventory` | `/more` | `/orders` | `/products` | `/settings`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
