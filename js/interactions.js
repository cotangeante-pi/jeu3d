const Interactions = {
  interact() {
    if (State.paused || State.gameOver) return;
    if (!State.nearNPC) return;
    document.exitPointerLock();
    UI.showDialog(State.nearNPC);
  },

  pickup() {
    if (State.paused || State.gameOver) return;
    if (!State.nearPickup) return;
    const p = State.nearPickup;

    // Cherche un slot existant pour stacker
    let slotIdx = State.inventory.findIndex(s => s && s.name === p.name);
    if (slotIdx === -1) {
      // Premier slot vide
      slotIdx = State.inventory.findIndex(s => s === null);
    }
    if (slotIdx === -1) return; // Inventaire plein

    if (State.inventory[slotIdx] && State.inventory[slotIdx].name === p.name) {
      State.inventory[slotIdx].count++;
    } else {
      State.inventory[slotIdx] = {
        name: p.name,
        color: p.color || '#dd2200',
        type: p.type || 'food',
        hungerBonus: p.hungerBonus || 0,
        healthBonus: p.healthBonus || 0,
        count: 1,
      };
    }

    if (p.mesh) State.scene.remove(p.mesh);
    State.pickups = State.pickups.filter(x => x !== p);
    State.nearPickup = null;
    Sound.pickup();
    HUD.update();
    Save.write();
  },

  eat() {
    const item = State.inventory[State.selectedSlot];
    if (!item || item.type !== 'food') return;
    Sound.eat();
    State.hunger = Math.min(100, State.hunger + item.hungerBonus);
    State.health = Math.min(100, State.health + item.healthBonus);
    item.count--;
    if (item.count <= 0) State.inventory[State.selectedSlot] = null;
    HUD.update();
    Save.write();
  },

  punch() {
    if (State.paused || State.gameOver) return;
    // Animation caméra
    const origPitch = State.pitch;
    State.pitch = Math.min(origPitch + 0.18, Math.PI / 2.2);
    setTimeout(() => { State.pitch = origPitch; }, 130);

    Sound.punch();

    // Détecte un humain à portée de poing (2.2m)
    const hit = Humans.getNearestHuman(State.posX, State.posZ, 2.2);
    if (!hit) return;

    Sound.hit();
    Humans.damageHuman(hit, hit.isPolice ? 8 : 15);

    const prevWanted = State.wanted;
    if (hit.isPolice) {
      State.wanted = Math.min(3, State.wanted + 2);
    } else {
      State.wanted = Math.min(3, State.wanted + 1);
    }
    if (State.wanted > prevWanted) Sound.wanted(State.wanted);
    State.wantedDecayTimer = 0;
    HUD.update();
  },

  buyFood(item) {
    if (State.money < item.price) {
      this._msg("Pas assez d'argent !");
      return false;
    }
    State.money -= item.price;
    State.hunger = Math.min(100, State.hunger + item.hungerBonus);
    State.health = Math.min(100, State.health + (item.healthBonus || 0));
    Sound.buy();
    HUD.update();
    Save.write();
    return true;
  },

  takeCourse(course) {
    if (State.money < course.price) { this._msg("Pas assez d'argent !"); return false; }
    if (State.iq < course.iqRequired) {
      this._msg(`QI minimum requis : ${course.iqRequired} (ton QI : ${Math.floor(State.iq)})`);
      return false;
    }
    State.money -= course.price;
    State.iq += course.iqGain;
    Sound.buy();
    HUD.update();
    Save.write();
    return true;
  },

  buyCar(car) {
    if (State.money < car.price) { this._msg("Pas assez d'argent !"); return false; }
    if (State.badges.includes(car.badgeId)) { this._msg('Tu possèdes déjà ce véhicule !'); return false; }
    State.money -= car.price;
    State.badges.push(car.badgeId);
    Cars.onCarBought(car.badgeId);
    Sound.buy();
    HUD.update();
    Save.write();
    return true;
  },

  applyForJob(employer) {
    const job = employer.job;
    if (State.currentJob && State.currentJob.id === job.id) {
      this._msg('Tu travailles déjà ici !');
      return false;
    }
    if (State.iq < job.iqRequired) {
      this._msg(`QI minimum requis : ${job.iqRequired} (ton QI : ${Math.floor(State.iq)})`);
      return false;
    }
    if (job.strengthRequired && State.physicalStats.strength < job.strengthRequired) {
      this._msg(`Force minimale requise : ${job.strengthRequired}`);
      return false;
    }
    Jobs.hire(job);
    Sound.coin();
    HUD.update();
    Save.write();
    return true;
  },

  _msg(text) {
    // Affiche un message rapide dans le dialog-desc si le dialog est ouvert, sinon alert
    const desc = document.getElementById('dialog-desc');
    if (document.getElementById('dialog-box').style.display !== 'none' && desc) {
      const orig = desc.textContent;
      desc.textContent = '⚠ ' + text;
      desc.style.color = '#ff8888';
      setTimeout(() => { desc.textContent = orig; desc.style.color = ''; }, 2000);
    } else {
      alert(text);
    }
  }
};
