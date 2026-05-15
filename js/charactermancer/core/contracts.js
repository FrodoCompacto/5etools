/**
 * @typedef {Object} UnifiedDataset
 * @property {object[]} class
 * @property {object[]} race
 * @property {object[]} background
 * @property {object[]} spell
 * @property {object[]} feat
 * @property {object[]} item
 * @property {object[]} optionalfeature
 * @property {object[]} language
 */

/**
 * @typedef {Partial<UnifiedDataset>} UnifiedDatasetPartial
 */

/**
 * @typedef {Object} PipelineLoadResult
 * @property {UnifiedDatasetPartial} contents
 * @property {string[]} [cacheKeys]
 */

/**
 * @typedef {Object} DataBundle
 * @property {UnifiedDataset} dataset
 * @property {string[]} cacheKeys
 * @property {Object} meta
 */

/**
 * @typedef {"newCharacter"|"always"} WizardTabVisibility
 */

/**
 * @typedef {"twoColumn"|"singleColumn"} WizardTabLayout
 */

/**
 * @typedef {Object} WizardTabDefinition
 * @property {string} id
 * @property {string} label
 * @property {string|null} stateKey
 * @property {readonly string[]} [datasetProps]
 * @property {WizardTabVisibility} visibility
 * @property {string} [domainComponentId]
 * @property {WizardTabLayout} layout
 * @property {string} selectTitle
 * @property {string} [headerMetaLabel] Semantic label for entry meta badge (e.g. "Primary Class"); not rendered by DomainTabFrame.
 * @property {boolean} [useGlobalListFilter] If false, omit list-page Filter/Search/Reset row (class tab uses inline controls).
 */

/**
 * @typedef {Object} DomainTabFrameMount
 * @property {HTMLElementExtended} wrpRoot
 * @property {HTMLElementExtended|null} wrpLeft
 * @property {HTMLElementExtended|null} wrpRight
 * @property {HTMLElementExtended|null} [wrpLeftMeta]
 * @property {HTMLElementExtended|null} [wrpFilterBar]
 * @property {boolean} [useGlobalListFilter]
 * @property {(opts?: { onFilterClick?: () => void|Promise<void>, onResetClick?: () => void }) => void} [enableFilterChrome]
 */

/**
 * @typedef {Object} DomainComponentValidateResult
 * @property {boolean} isValid
 * @property {string[]} messages
 */

/**
 * @typedef {Object} DomainComponentFactoryContext
 * @property {UnifiedDataset} dataset
 * @property {import("../state/character-build-state.js").CharacterBuildState} buildState
 * @property {WizardTabDefinition} tab
 * @property {DomainTabFrameMount} frameMount
 */

/**
 * @typedef {"ok"|"warning"|"error"} FinalizeTaskStatus
 */

/**
 * @typedef {Object} FinalizeTaskResult
 * @property {FinalizeTaskStatus} status
 * @property {string} domain
 * @property {string[]} messages
 * @property {Object} [patchSummary]
 * @property {number} timingMs
 */

export {};
