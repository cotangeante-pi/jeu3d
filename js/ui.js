const UI = {
  init() {
    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-quit').addEventListener('click', () => {
      Save.write();
      document.getElementById('pause-menu').style.display = 'none';
      State.paused = false;
    });
    document.getElementById('btn-restart').addEventListener('click', () => this.restart());
    document.getElementById('btn-capacities').addEventListener('click', () => this.showCapacities());

    document.getElementById('btn-close-cap').addEventListener('click', () => {
      document.getElementById('capacities-panel').style.display = 'none';
      this._reLock();
    });

    document.getElementById('btn-close-dialog').addEventListener('click', () => {
      document.getElementById('dialog-box').style.display = 'none';
      this._reLock();
    });
  },

  togglePause() {
    if (State.gameOver) return;
    State.paused = !State.paused;
    document.getElementById('pause-menu').style.display = State.paused ? 'flex' : 'none';
    if (State.paused) {
      document.exitPointerLock();
    } else {
      this._reLock();
    }
  },

  showGameOver(reason) {
    if (State.gameOver) return;
    State.gameOver = true;
    document.exitPointerLock();
    document.getElementById('gameover-reason').textContent = reason;
    document.getElementById('gameover-overlay').style.display = 'flex';
  },

  restart() {
    Save.clear();
    location.reload();
  },

  showCapacities() {
    document.exitPointerLock();
    const s = State.physicalStats;
    const job = State.currentJob ? State.currentJob.name : 'Aucun';
    document.getElementById('capacities-content').innerHTML = `
      <p><strong>Force :</strong> ${s.strength}</p>
      <p><strong>Vitesse :</strong> ${s.speed}</p>
      <p><strong>Endurance :</strong> ${s.endurance}</p>
      <hr style="margin:12px 0; border-color:#444">
      <p><strong>Emploi actuel :</strong> ${job}</p>
    `;
    document.getElementById('capacities-panel').style.display = 'flex';
  },

  showDialog(npc) {
    const titleEl = document.getElementById('dialog-title');
    const descEl  = document.getElementById('dialog-desc');
    const optDiv  = document.getElementById('dialog-options');

    titleEl.textContent = npc.name;
    optDiv.innerHTML = '';
    descEl.style.color = '';

    const closeDialog = () => {
      document.getElementById('dialog-box').style.display = 'none';
      this._reLock();
    };

    if (npc.type === 'merchant') {
      descEl.textContent = 'Que veux-tu acheter ? (Ton argent : $' + Math.floor(State.money) + ')';
      npc.stock.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = `${item.name} — ${item.price}$ (+${item.hungerBonus} faim, +${item.healthBonus} vie)`;
        btn.onclick = () => {
          const ok = Interactions.buyFood(item);
          if (ok) {
            descEl.textContent = 'Acheté ! (Argent restant : $' + Math.floor(State.money) + ')';
          }
        };
        optDiv.appendChild(btn);
      });

    } else if (npc.type === 'school') {
      descEl.textContent = 'Ton QI actuel : ' + Math.floor(State.iq);
      npc.courses.forEach(course => {
        const btn = document.createElement('button');
        btn.textContent = `${course.name} — ${course.price}$ (+${course.iqGain} QI, min. QI ${course.iqRequired})`;
        btn.onclick = () => {
          const ok = Interactions.takeCourse(course);
          if (ok) descEl.textContent = 'Cours suivi ! Ton QI : ' + Math.floor(State.iq);
        };
        optDiv.appendChild(btn);
      });

    } else if (npc.type === 'employer') {
      const job = npc.job;
      const isMyJob = State.currentJob && State.currentJob.id === job.id;
      descEl.textContent = `Poste : ${job.name} | Salaire : ${job.salary}$ / min | QI requis : ${job.iqRequired}`;

      // Bouton livraison pommes (boulanger)
      const task = State.jobTask;
      if (isMyJob && task && task.type === 'fetch_apples' && task.phase === 'active') {
        let apples = 0;
        State.inventory.forEach(s => { if (s && s.name === 'Pomme') apples += s.count; });
        const delivBtn = document.createElement('button');
        delivBtn.textContent = `Livrer les pommes (${apples}/${task.required} en stock)`;
        delivBtn.style.background = apples >= task.required ? '#1a6a1a' : '#555';
        delivBtn.onclick = () => {
          const ok = Jobs.tryDeliverApples();
          if (ok) {
            descEl.textContent = 'Livraison effectuée ! Bonus reçu.';
            delivBtn.remove();
          } else {
            descEl.textContent = `Pas assez de pommes ! (${apples}/${task.required})`;
          }
        };
        optDiv.appendChild(delivBtn);
      }

      const btn = document.createElement('button');
      btn.textContent = isMyJob ? 'Tu travailles déjà ici' : 'Postuler';
      btn.onclick = () => {
        const ok = Interactions.applyForJob(npc);
        if (ok) {
          descEl.textContent = `Félicitations ! Tu es maintenant ${job.name}.`;
          btn.textContent = 'Tu travailles déjà ici';
        }
      };
      optDiv.appendChild(btn);

      // Bouton quitter son emploi
      if (State.currentJob) {
        const quitBtn = document.createElement('button');
        quitBtn.textContent = 'Quitter mon emploi actuel (' + State.currentJob.name + ')';
        quitBtn.style.background = '#7a2020';
        quitBtn.onclick = () => {
          Jobs.quit();
          HUD.update();
          Save.write();
          closeDialog();
        };
        optDiv.appendChild(quitBtn);
      }

    } else if (npc.type === 'cardeal') {
      descEl.textContent = `Concession automobile | Ton argent : $${Math.floor(State.money)}`;
      npc.cars.forEach(car => {
        const btn = document.createElement('button');
        const owned = State.badges.includes(car.badgeId);
        btn.textContent = owned
          ? `${car.name} — Déjà possédée ✓`
          : `${car.name} — ${car.price}$`;
        btn.disabled = owned;
        btn.onclick = () => {
          const ok = Interactions.buyCar(car);
          if (ok) {
            descEl.textContent = `Félicitations ! Tu possèdes maintenant une ${car.name}.`;
            btn.textContent = `${car.name} — Déjà possédée ✓`;
            btn.disabled = true;
          }
        };
        optDiv.appendChild(btn);
      });
    }

    document.getElementById('dialog-box').style.display = 'flex';
  },

  _reLock() {
    if (!State.paused && !State.gameOver) {
      const canvas = document.getElementById('game-canvas');
      canvas.requestPointerLock();
    }
  }
};
