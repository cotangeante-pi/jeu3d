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
    State.hunger = Math.min(100, State.hunger + (p.hungerBonus || 0));
    State.health = Math.min(100, State.health + (p.healthBonus || 0));
    if (p.mesh) State.scene.remove(p.mesh);
    State.pickups = State.pickups.filter(x => x !== p);
    State.nearPickup = null;
    HUD.update();
  },

  punch() {
    if (State.paused || State.gameOver) return;
    // Légère animation : coup de caméra vers le bas puis retour
    const origPitch = State.pitch;
    State.pitch = Math.min(origPitch + 0.18, Math.PI / 2.2);
    setTimeout(() => { State.pitch = origPitch; }, 130);
  },

  buyFood(item) {
    if (State.money < item.price) {
      this._msg("Pas assez d'argent !");
      return false;
    }
    State.money -= item.price;
    State.hunger = Math.min(100, State.hunger + item.hungerBonus);
    State.health = Math.min(100, State.health + (item.healthBonus || 0));
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
    HUD.update();
    Save.write();
    return true;
  },

  buyCar(car) {
    if (State.money < car.price) { this._msg("Pas assez d'argent !"); return false; }
    if (State.badges.includes(car.badgeId)) { this._msg('Tu possèdes déjà ce véhicule !'); return false; }
    State.money -= car.price;
    State.badges.push(car.badgeId);
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
    State.currentJob = job;
    if (!State.badges.includes(job.id)) State.badges.push(job.id);
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
