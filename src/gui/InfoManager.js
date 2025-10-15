import $ from 'jquery';

const PLANET_INFO_SELECT_ID = 'planetInfoSelect';
const PLANET_INFO_INFO_ID   = 'planetInfoInfo';

export default class InfoManager {
    constructor(gui, universe) {
      
        this.gui = gui;
        this.universe = universe;
        const bodies = (universe && Array.isArray(universe.bodies)) ? universe.bodies : [];
        this.bodyMap = new Map(bodies.map(b => [b.name, b]));

        // 1) 下拉
        this.select = gui.addDropdown(PLANET_INFO_SELECT_ID, () => {
            this.renderInfo(this.select.getValue());
        });

        // 2) 填充选项
        bodies.forEach(b => this.select.addOption(b.title || b.name, b.name));
        
        // 3) 默认选中第一个并渲染
        if (bodies.length) {
        const first = bodies[0].name;
        if (this.select.setValue) this.select.setValue(first);
        this.renderInfo(first);
        }
    }

    renderInfo(name) {
    const body = this.bodyMap.get(name);
    const $cont = this.gui.getContainer('planetInfoInfo');
    if (!body || !$cont.length) return;

    const text = [
        `Title: ${body.title || body.name}`,
        `Name: ${body.name}`,
        `Radius (km): ${body.radius}`,
        `Mass (kg): ${body.mass}`,
    ].join('<br>');

    this.gui.getLabel('planetInfoInfo').addClass('shown');

    $cont.empty().html(text);
    }
}
