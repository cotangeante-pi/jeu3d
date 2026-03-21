const Jobs = {
  tick(delta) {
    if (State.paused || State.gameOver) return;
    if (!State.currentJob) return;

    State.salaryTimer += delta;
    if (State.salaryTimer >= CONFIG.SALARY_INTERVAL) {
      State.salaryTimer -= CONFIG.SALARY_INTERVAL;
      State.money += State.currentJob.salary;
      HUD.update();
      Save.write();
    }
  },

  hire(job) {
    State.currentJob = job;
    if (!State.badges.includes(job.id)) State.badges.push(job.id);
  },

  quit() {
    State.currentJob = null;
    State.salaryTimer = 0;
  }
};
