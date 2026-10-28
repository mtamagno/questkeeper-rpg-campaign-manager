export interface CompendiumPackageManifest {
  readonly schemaVersion: 1;
  readonly namespace: string;
  readonly version: string;
  readonly kind: 'bundled' | 'local';
  readonly visibility: 'public' | 'private';
  readonly owner: string;
  readonly source: { readonly name: string; readonly url: string };
  readonly ruleset: { readonly id: string; readonly edition: string };
  readonly locales: ReadonlyArray<string>;
  readonly license: {
    readonly id: string;
    readonly url: string;
    readonly attribution: string;
    readonly redistributable: boolean;
  };
}

export interface CompendiumPackageEntry {
  readonly id: string;
  readonly type: string;
  readonly name: Readonly<Record<string, string>>;
  readonly summary?: Readonly<Record<string, string>>;
  readonly content?: Readonly<Record<string, string>>;
  readonly references?: ReadonlyArray<string>;
  readonly overrideOf?: string;
}

export interface CompendiumPackage {
  readonly manifest: CompendiumPackageManifest;
  readonly entries: ReadonlyArray<CompendiumPackageEntry>;
}
