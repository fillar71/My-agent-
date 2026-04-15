/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppProvider } from "./store";
import { Layout } from "./components/Layout";

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
