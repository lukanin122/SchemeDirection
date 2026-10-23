// Schematic Direction Arrow — desktop, Mindustry v7/v8
// Стартовое направление: 0 вправо, 1 вверх, 2 влево, 3 вниз.
// Ползунок scheme-arrow-start в настройках. По умолчанию 3 (вниз).

var schematicArrowDirection = 0;
var schematicArrowMarker = null;

function schematicArrowMod4(value){
    value = value | 0;
    return ((value % 4) + 4) % 4;
}

function schematicArrowStart(){
    return schematicArrowMod4(Core.settings.getInt("scheme-arrow-start", 3));
}

function schematicArrowWord(value){
    if(value === 0) return Core.bundle.get("scheme-arrow.right", "right");
    if(value === 1) return Core.bundle.get("scheme-arrow.up", "up");
    if(value === 2) return Core.bundle.get("scheme-arrow.left", "left");
    return Core.bundle.get("scheme-arrow.down", "down");
}

function schematicArrowReset(){
    schematicArrowDirection = 0;
    schematicArrowMarker = null;
}

Events.on(ClientLoadEvent, () => {
    Vars.ui.settings.game.sliderPref("scheme-arrow-start", 3, 0, 3, 1, s => {
        return schematicArrowWord(s);
    });
});

Events.run(Trigger.update, () => {
    if(Vars.mobile || Vars.control == null || Vars.control.input == null){
        schematicArrowReset();
        return;
    }

    var input = Vars.control.input;
    var plans = input.selectPlans;
    if(plans == null || plans.isEmpty()){
        schematicArrowReset();
        return;
    }

    var marker = plans.first();
    if(marker !== schematicArrowMarker){
        schematicArrowMarker = marker;
        schematicArrowDirection = schematicArrowStart();
    }

    if(!Core.input.keyDown(Binding.diagonalPlacement)){
        var rotateAxis = Core.input.axisTap(Binding.rotate) | 0;
        if(rotateAxis !== 0 && !Vars.ui.chatfrag.shown()){
            schematicArrowDirection = schematicArrowMod4(
                schematicArrowDirection + (rotateAxis > 0 ? 1 : -1)
            );
        }
    }

    if(!Vars.state.isMenu() && !Core.scene.hasField() &&
        Vars.player != null && !Vars.player.dead() && !input.locked()){
        if(Core.input.keyTap(Binding.schematicFlipX) && schematicArrowDirection % 2 === 0){
            schematicArrowDirection = schematicArrowMod4(schematicArrowDirection + 2);
        }
        if(Core.input.keyTap(Binding.schematicFlipY) && schematicArrowDirection % 2 !== 0){
            schematicArrowDirection = schematicArrowMod4(schematicArrowDirection + 2);
        }
    }
});

Events.run(Trigger.draw, () => {
    if(Vars.mobile || Vars.control == null || Vars.control.input == null) return;

    var plans = Vars.control.input.selectPlans;
    if(plans == null || plans.isEmpty()) return;

    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;

    for(var i = 0; i < plans.size; i++){
        var plan = plans.get(i);
        if(plan == null || plan.breaking || plan.block == null) continue;

        var block = plan.block;
        var centerX = plan.x * Vars.tilesize + block.offset;
        var centerY = plan.y * Vars.tilesize + block.offset;
        var half = block.size * Vars.tilesize / 2;

        if(centerX - half < minX) minX = centerX - half;
        if(centerY - half < minY) minY = centerY - half;
        if(centerX + half > maxX) maxX = centerX + half;
        if(centerY + half > maxY) maxY = centerY + half;
    }

    if(minX === Infinity) return;

    var arrowX = (minX + maxX) / 2;
    var arrowY = (minY + maxY) / 2;
    var margin = Vars.tilesize * 0.75;
    var direction = schematicArrowDirection;

    if(direction === 0) arrowX = maxX + margin;
    else if(direction === 1) arrowY = maxY + margin;
    else if(direction === 2) arrowX = minX - margin;
    else arrowY = minY - margin;

    var angle = direction * 90 - 90;

    Draw.draw(Layer.overlayUI, () => {
        var arrow = Core.atlas.find("place-arrow");
        var w = arrow.width * arrow.scl();
        var h = arrow.height * arrow.scl();

        Draw.z(Layer.overlayUI);
        Draw.color(Pal.accentBack);
        Draw.rect(arrow, arrowX, arrowY - 1, w, h, angle);
        Draw.color(Pal.accent);
        Draw.rect(arrow, arrowX, arrowY, w, h, angle);
        Draw.reset();
    });
});