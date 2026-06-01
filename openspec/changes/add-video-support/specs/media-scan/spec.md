## ADDED Requirements

### Requirement: Video file discovery
The node helper SHALL discover video files from `imagePaths` directories using the `videoExtensions` config, in addition to the existing image file discovery.

#### Scenario: Mixed directory with images and videos
- **WHEN** a directory contains both image files and video files
- **AND** both `imageExtensions` and `videoExtensions` include the relevant file types
- **THEN** both image and video files SHALL be included in the scan results

#### Scenario: Only images configured
- **WHEN** `videoExtensions` is empty or not set
- **THEN** only image files SHALL be returned, identical to current behavior

---

### Requirement: Typed scan results
The node helper SHALL tag each scanned file with its media type in the `PHOTOSTACK_IMAGES` socket notification. The payload SHALL use `items: Array<{url: string, type: "image"|"video"}>` instead of `urls: string[]`.

#### Scenario: Image file in scan results
- **WHEN** a file matches an extension in `imageExtensions`
- **THEN** it SHALL appear in `items` with `type: "image"`

#### Scenario: Video file in scan results
- **WHEN** a file matches an extension in `videoExtensions`
- **THEN** it SHALL appear in `items` with `type: "video"`

#### Scenario: Shuffle applies to mixed items
- **WHEN** `randomize` is true
- **THEN** the shuffle SHALL apply to the combined `items` array, interleaving images and videos randomly

---

### Requirement: Video extensions passed via registration
The frontend SHALL include `videoExtensions` in the `PHOTOSTACK_REGISTER` notification payload so the node helper can perform type-tagged scanning without needing to parse the config independently.

#### Scenario: Registration payload includes video extensions
- **WHEN** the module sends `PHOTOSTACK_REGISTER`
- **THEN** the payload SHALL include a `videoExtensions` field containing the configured array
