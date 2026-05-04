const LightVehicles = {
  VEHICLES: [
    { id: 'bike',       name: 'Vélo',              icon: '🚲', price: 120, speedMult: 1.6 },
    { id: 'scooter',    name: 'Trottinette',        icon: '🛴', price: 80,  speedMult: 1.9 },
    { id: 'skateboard', name: 'Skateboard',         icon: '🛹', price: 60,  speedMult: 1.5 },
    { id: 'skates',     name: 'Patins à roulettes', icon: '⛸', price: 70,  speedMult: 1.7 },
  ],

  getSpeedMult() {
    if (!State.inLightVehicle || !State.lightVehicleType) return 1.0;
    const v = this.VEHICLES.find(v => v.id === State.lightVehicleType);
    return v ? v.speedMult : 1.0;
  },

  getActiveVehicle() {
    if (!State.lightVehicleType) return null;
    return this.VEHICLES.find(v => v.id === State.lightVehicleType) || null;
  },

  tryMount() {
    if (State.inCar) return;
    const owned = this.VEHICLES.filter(v => State.badges.includes('lv_' + v.id));
    if (owned.length === 0) {
      Jobs._notify('Aucun engin possédé — achète-en un à la boutique.', '#ffaa44');
      return;
    }
    const v = State.lightVehicleType
      ? (this.VEHICLES.find(v => v.id === State.lightVehicleType) || owned[owned.length - 1])
      : owned[owned.length - 1];
    State.inLightVehicle = true;
    State.lightVehicleType = v.id;
    Save.write();
    HUD.update();
    Jobs._notify(`${v.icon} En selle : ${v.name} !`, '#88ddff');
  },

  dismount() {
    if (!State.inLightVehicle) return;
    const v = this.getActiveVehicle();
    State.inLightVehicle = false;
    Save.write();
    HUD.update();
    Jobs._notify(v ? `${v.icon} Tu descends du ${v.name}.` : 'Descendu.', '#aaaaaa');
  },
};
