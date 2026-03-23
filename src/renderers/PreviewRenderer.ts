/**
 * PreviewRenderer - Orchestrates all preview rendering
 *
 * Coordinates rendering of all recipe sections by delegating to
 * specialized renderer modules. Handles overall preview layout.
 */

import type { CooklangRecipe } from '@cooklang/cooklang-ts';
import { App, TFile } from 'obsidian';
import { CooklangSettings } from '../settings';
import { TimerService } from '../services/TimerService';
import { findRecipeImages } from '../utils/imageHelpers';
import { MetadataRenderer } from './MetadataRenderer';
import { IngredientListRenderer } from './IngredientListRenderer';
import { CookwareListRenderer } from './CookwareListRenderer';
import { TimerListRenderer } from './TimerListRenderer';
import { MethodStepsRenderer } from './MethodStepsRenderer';

/**
 * Orchestrates rendering of recipe preview
 */
export class PreviewRenderer {
    private metadataRenderer: MetadataRenderer;
    private ingredientRenderer: IngredientListRenderer;
    private cookwareRenderer: CookwareListRenderer;
    private timerListRenderer: TimerListRenderer;
    private methodStepsRenderer: MethodStepsRenderer;

    constructor(
        private app: App,
        private settings: CooklangSettings,
        private timerService: TimerService
    ) {
        // Initialize all specialized renderers
        this.metadataRenderer = new MetadataRenderer(settings);
        this.ingredientRenderer = new IngredientListRenderer(settings);
        this.cookwareRenderer = new CookwareListRenderer(settings);
        this.timerListRenderer = new TimerListRenderer(settings);
        this.methodStepsRenderer = new MethodStepsRenderer(settings, timerService);
    }

    /**
     * Render complete recipe preview
     * @param recipe - Parsed recipe object
     * @param container - Container element to render into
     * @param file - Recipe file (for finding images)
     * @param checkedIngredients - Set of checked ingredient IDs
     * @param onIngredientToggle - Callback when ingredient is toggled
     */
    public render(
        recipe: CooklangRecipe,
        container: HTMLElement,
        file: TFile | null,
        checkedIngredients?: Set<string>,
        onIngredientToggle?: () => void
    ): void {
        // Clear container
        container.empty();

        // Header row: image (left) + metadata (right)
        const header = container.createDiv({ cls: 'cook-header' });

        if (this.settings.showImages && file) {
            this.renderMainImage(header, file);
        }

        const metaCol = header.createDiv({ cls: 'cook-header-meta' });
        this.metadataRenderer.render(recipe, metaCol);

        // Create two-column body: sidebar (ingredients) + main (directions)
        const bodyWrapper = container.createDiv({ cls: 'cook-recipe-body' });

        const sidebar = bodyWrapper.createDiv({ cls: 'cook-sidebar' });
        this.ingredientRenderer.render(recipe, sidebar, checkedIngredients, onIngredientToggle);
        this.cookwareRenderer.render(recipe, sidebar);
        this.timerListRenderer.render(recipe, sidebar);

        const main = bodyWrapper.createDiv({ cls: 'cook-main' });
        this.methodStepsRenderer.render(recipe, main);
    }

    /**
     * Render main recipe image
     * @param container - Container element to render into
     * @param file - Recipe file
     */
    private renderMainImage(container: HTMLElement, file: TFile): void {
        const { mainImage } = findRecipeImages(file);

        if (mainImage) {
            const img = container.createEl('img', { cls: 'main-image' });
            img.src = this.app.vault.getResourcePath(mainImage);
        }
    }

    /**
     * Update settings for all renderers
     * @param settings - New settings object
     */
    public updateSettings(settings: CooklangSettings): void {
        this.settings = settings;

        // Update settings for all renderers
        this.metadataRenderer = new MetadataRenderer(settings);
        this.ingredientRenderer = new IngredientListRenderer(settings);
        this.cookwareRenderer = new CookwareListRenderer(settings);
        this.timerListRenderer = new TimerListRenderer(settings);
        this.methodStepsRenderer = new MethodStepsRenderer(settings, this.timerService);
    }
}
