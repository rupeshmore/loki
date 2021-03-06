const fs = require('fs-extra');
const path = require('path');
const { ReferenceImageError } = require('../../errors');
const { getImageDiffer } = require('../../diffing');

const getBaseName = (configurationName, kind, story) =>
  `${configurationName} ${kind} ${story}`.replace(/[^a-zA-Z0-9.-]/g, '_');

async function testStory(
  target,
  options,
  tolerance,
  configuration,
  configurationName,
  kind,
  story
) {
  const basename = getBaseName(configurationName, kind, story);
  const filename = `${basename}.png`;
  const outputPath = `${options.outputDir}/${filename}`;
  const referencePath = `${options.referenceDir}/${filename}`;
  const diffPath = `${options.differenceDir}/${filename}`;
  await target.captureScreenshotForStory(
    kind,
    story,
    options.updateReference ? referencePath : outputPath,
    options,
    configuration
  );
  if (options.updateReference) {
    return;
  }
  if (await fs.pathExists(referencePath)) {
    const isEqual = await getImageDiffer(options.diffingEngine)(
      referencePath,
      outputPath,
      diffPath,
      tolerance
    );
    if (!isEqual) {
      throw new ReferenceImageError(
        `Screenshot differs from reference, see ${path.relative(
          path.resolve('./'),
          diffPath
        )}`,
        kind,
        story
      );
    }
  } else if (options.requireReference) {
    throw new ReferenceImageError('No reference image found', kind, story);
  }
}

module.exports = testStory;
