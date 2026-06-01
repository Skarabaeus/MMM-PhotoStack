## ADDED Requirements

### Requirement: Images render at natural aspect ratio
The module SHALL display images at their intrinsic aspect ratio. No axis SHALL be cropped or letterboxed by default.

#### Scenario: Portrait image renders without cropping
- **WHEN** a portrait-oriented image (taller than wide) is displayed in a card
- **THEN** the full height of the image SHALL be visible within the card frame

#### Scenario: Landscape image renders without cropping
- **WHEN** a landscape-oriented image (wider than tall) is displayed in a card
- **THEN** the full width of the image SHALL be visible within the card frame

#### Scenario: Square image renders without cropping
- **WHEN** a square image is displayed in a card
- **THEN** the full image SHALL be visible within the card frame

### Requirement: photoHeight config controls container height
The module SHALL expose a `photoHeight` config option (integer, pixels) that sets the CSS custom property `--photo-height` on the container element. The container height SHALL be derived from `--photo-height`.

#### Scenario: Default photoHeight accommodates portrait images
- **WHEN** no `photoHeight` is set in config
- **THEN** the default value SHALL be `600` (pixels), sufficient to display a 2:3 portrait at the default `photoWidth` of 400 without clipping

#### Scenario: User overrides photoHeight
- **WHEN** `photoHeight: 300` is set in config
- **THEN** the container height SHALL reflect 300px as the photo area height, matching the pre-change landscape-only footprint

### Requirement: Image width remains config-driven
The image width SHALL continue to be controlled by the existing `photoWidth` config option.

#### Scenario: photoWidth applies to all image orientations
- **WHEN** any image is displayed
- **THEN** its rendered width SHALL equal `photoWidth` pixels regardless of the image's intrinsic aspect ratio
