/**
 * One-shot: point app.kangur build credentials at the same keystore as
 * app.kangur.mobile, then delete the wrong keystore (SHA 3E:56...).
 * Does NOT print keystore passwords or base64 material.
 */
const fs = require("fs");
const path = require("path");

const PROJECT = "@chris38pl/kangur";
const OLD_PACKAGE = "app.kangur.mobile";
const NEW_PACKAGE = "app.kangur";
const EXPECTED_SHA1 =
  "F5:98:FD:53:27:CC:C2:5C:FC:7E:CC:DD:DF:07:D1:22:CB:8E:9C:C2";
const BAD_SHA1_PREFIX = "3E:56:8E:C5";

const FRAGMENT = `
fragment AndroidKeystoreFragment on AndroidKeystore {
  id
  type
  keyAlias
  md5CertificateFingerprint
  sha1CertificateFingerprint
  sha256CertificateFingerprint
  createdAt
}
fragment AndroidAppBuildCredentialsFragment on AndroidAppBuildCredentials {
  id
  name
  isDefault
  androidKeystore {
    id
    ...AndroidKeystoreFragment
  }
}
`;

async function gql(sessionSecret, query, variables) {
  const res = await fetch("https://api.expo.dev/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "expo-session": sessionSecret,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

function normalizeSha1(s) {
  return (s || "").toUpperCase().replace(/[^0-9A-F]/g, "");
}

async function getAppCredentials(sessionSecret, applicationIdentifier) {
  const data = await gql(
    sessionSecret,
    `
    ${FRAGMENT}
    query ($projectFullName: String!, $applicationIdentifier: String) {
      app {
        byFullName(fullName: $projectFullName) {
          id
          androidAppCredentials(
            filter: {
              applicationIdentifier: $applicationIdentifier
              legacyOnly: false
            }
          ) {
            id
            applicationIdentifier
            androidAppBuildCredentialsList {
              id
              ...AndroidAppBuildCredentialsFragment
            }
          }
        }
      }
    }
    `,
    { projectFullName: PROJECT, applicationIdentifier },
  );
  return data.app.byFullName.androidAppCredentials[0] ?? null;
}

async function main() {
  const statePath = path.join(process.env.USERPROFILE, ".expo", "state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const sessionSecret = state.auth?.sessionSecret;
  if (!sessionSecret) throw new Error("No Expo session in ~/.expo/state.json");

  const oldCreds = await getAppCredentials(sessionSecret, OLD_PACKAGE);
  const newCreds = await getAppCredentials(sessionSecret, NEW_PACKAGE);
  if (!oldCreds) throw new Error(`No credentials for ${OLD_PACKAGE}`);
  if (!newCreds) throw new Error(`No credentials for ${NEW_PACKAGE}`);

  const oldDefault =
    oldCreds.androidAppBuildCredentialsList.find((c) => c.isDefault) ||
    oldCreds.androidAppBuildCredentialsList[0];
  const newDefault =
    newCreds.androidAppBuildCredentialsList.find((c) => c.isDefault) ||
    newCreds.androidAppBuildCredentialsList[0];

  if (!oldDefault?.androidKeystore)
    throw new Error(`No keystore on ${OLD_PACKAGE}`);
  if (!newDefault?.androidKeystore)
    throw new Error(`No keystore on ${NEW_PACKAGE}`);

  const good = oldDefault.androidKeystore;
  const bad = newDefault.androidKeystore;

  console.log("OLD package keystore:", {
    id: good.id,
    alias: good.keyAlias,
    sha1: good.sha1CertificateFingerprint,
  });
  console.log("NEW package keystore (before):", {
    id: bad.id,
    alias: bad.keyAlias,
    sha1: bad.sha1CertificateFingerprint,
  });

  if (normalizeSha1(good.sha1CertificateFingerprint) !== normalizeSha1(EXPECTED_SHA1)) {
    throw new Error(
      `Old keystore SHA1 mismatch. Got ${good.sha1CertificateFingerprint}`,
    );
  }
  if (!normalizeSha1(bad.sha1CertificateFingerprint).startsWith(normalizeSha1(BAD_SHA1_PREFIX))) {
    console.warn(
      "Warning: new keystore SHA1 does not start with expected bad prefix; continuing carefully.",
    );
  }

  if (good.id === bad.id) {
    console.log("Already sharing the same keystore — nothing to assign.");
  } else {
    console.log("Assigning old keystore to app.kangur build credentials...");
    await gql(
      sessionSecret,
      `
      ${FRAGMENT}
      mutation ($androidAppBuildCredentialsId: ID!, $keystoreId: ID!) {
        androidAppBuildCredentials {
          setKeystore(id: $androidAppBuildCredentialsId, keystoreId: $keystoreId) {
            id
            ...AndroidAppBuildCredentialsFragment
          }
        }
      }
      `,
      {
        androidAppBuildCredentialsId: newDefault.id,
        keystoreId: good.id,
      },
    );
    console.log("Assigned.");
  }

  // Re-fetch to confirm
  const after = await getAppCredentials(sessionSecret, NEW_PACKAGE);
  const afterDefault =
    after.androidAppBuildCredentialsList.find((c) => c.isDefault) ||
    after.androidAppBuildCredentialsList[0];
  console.log("NEW package keystore (after):", {
    id: afterDefault.androidKeystore.id,
    sha1: afterDefault.androidKeystore.sha1CertificateFingerprint,
  });

  if (
    normalizeSha1(afterDefault.androidKeystore.sha1CertificateFingerprint) !==
    normalizeSha1(EXPECTED_SHA1)
  ) {
    throw new Error("Assignment verification failed — SHA1 still wrong.");
  }

  // Delete bad keystore only if it is no longer referenced and SHA matches bad prefix
  if (bad.id !== good.id) {
    const stillUsed =
      after.androidAppBuildCredentialsList.some(
        (c) => c.androidKeystore?.id === bad.id,
      ) ||
      (await getAppCredentials(sessionSecret, OLD_PACKAGE))
        ?.androidAppBuildCredentialsList?.some(
          (c) => c.androidKeystore?.id === bad.id,
        );
    if (stillUsed) {
      console.warn("Bad keystore still referenced somewhere — NOT deleting.");
    } else if (
      normalizeSha1(bad.sha1CertificateFingerprint).startsWith(
        normalizeSha1(BAD_SHA1_PREFIX),
      )
    ) {
      console.log("Deleting unused wrong keystore", bad.id);
      await gql(
        sessionSecret,
        `
        mutation ($androidKeystoreId: ID!) {
          androidKeystore {
            deleteAndroidKeystore(id: $androidKeystoreId) {
              id
            }
          }
        }
        `,
        { androidKeystoreId: bad.id },
      );
      console.log("Deleted.");
    } else {
      console.warn("Bad keystore SHA unexpected — NOT deleting for safety.");
    }
  }

  console.log("DONE credentials fix.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
