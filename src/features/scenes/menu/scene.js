import { PLAYER_ONE, SCREEN_WIDTH } from "../../../shared/config/constants.js";
import { Scene } from "../../../shared/lib/scene_manager.js";
import Selector from "../../../shared/lib/selector.js";

export class MenuFlowScene extends Scene {
    getPanels() {
        throw new Error("getPanels() precisa ser implementado");
    }

    getInitialPanel() {
        return Object.keys(this.getPanels())[0];
    }

    onEnter(assets) {
        this.assets = assets;
        this.font = assets.fonts["fonts/main.ttf"];
        this.confirmSFX = assets.sounds["sounds/sfx/kick.adp"];
        this.selectSFX = assets.sounds["sounds/sfx/pop.adp"];
        this.button = assets.images["images/ui/button.png"];
        this.buttonBlur = assets.images["images/ui/button_blur.png"];

        this.baseTextColor = Color.new(0, 51, 0);

        this.panels = this.getPanels();
        this._openPanel(this.getInitialPanel());
    }

    _openPanel(panelKey) {
        const panelDef = this.panels[panelKey];
        this.activePanelKey = panelKey;

        this.selector = new Selector(panelDef.getOptions(this), {
            selectorSFX: this.selectSFX,
            confirmSFX: this.confirmSFX,
            onConfirm: (option) => option.action(this),
        });
    }

    goToPanel(panelKey) {
        this._openPanel(panelKey);
    }

    onUpdate(dt) {
        this.selector.update(PLAYER_ONE);
    }

    _drawText(x, y, text, scale = 0.85, isSelected) {
        this.font.color = this.baseTextColor;
        this.font.scale = scale;

        const buttonX = (SCREEN_WIDTH / 2) - (this.button.width / 2);
        this.button.draw(buttonX, y);

        const textSize = this.font.getTextSize(text);

        const textX = x === 0
            ? buttonX + (this.button.width / 2) - (textSize.width / 2)
            : x;

        const textY = y + (this.button.height / 2) - (textSize.height / 2);

        this.font.print(textX, textY, text);

        isSelected && this.buttonBlur.draw(buttonX, y);
    }

    drawOptions(startY, lineHeight = 50) {
        this.selector.items.forEach((option, index) => {
            const isSelected = this.selector.index === index;
            this._drawText(0, startY + index * lineHeight, option.key, 0.85, isSelected);
        });
    }

    onDraw() {
        const panelDef = this.panels[this.activePanelKey];
        panelDef.draw(this);
    }
}