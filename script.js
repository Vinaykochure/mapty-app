'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(distance, duration, coords) {
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.coords = coords; // [lat,lng]
  }

  _discription() {
    const localLanguage = navigator.language;
    const option = {
      month: 'short',
      day: 'numeric',
    };

    // prettier-ignore
    this.discription = `${
      this.type.charAt(0).toUpperCase() + this.type.slice(1)
    } on ${this.date.toLocaleString(localLanguage,option)} ⏱${this.date.toLocaleTimeString()}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._discription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._discription();
  }

  calcSpeed() {
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//app architecture with ES6 classes
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clearWorkoutBtn = document.getElementById('clear-workouts');

class MapApp {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    //gettting users position
    this._getPosition();

    //getting local storage
    this._getLocalStorage();

    //adding/handling events
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    clearWorkoutBtn.addEventListener('click', this._resetWorkouts);

    //moving map to marker after click
    containerWorkouts.addEventListener(
      'click',
      this._moveToMarkerOnMap.bind(this)
    );
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(latitude, longitude);

    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    // console.log(map);

    L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._rendorWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    form.classList.add('hidden');
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value =inputElevation.value ='';

    //NOT USING THIS COZ LIKE THIS EXISTING AMINATION
    /* 
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
    */
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    e.preventDefault();

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //gaurd claus
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._rendorWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    //set local storage
    this._setLocalStorage();
  }

  _rendorWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 28,
          closeOnClick: false,
          autoClose: false,
          className: `${workout.type}-popup`,
        })
        // Render workout on map as marker
        // Render workout on list
      )
      .setPopupContent(`${workout.discription}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.discription.slice()}</h2>
        <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running') {
      html += `
       <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(2)}</span>
        <span class="workout__unit">min/km</span>
       </div>
      <div class="workout__details">
       <span class="workout__icon">🦶🏼</span>
       <span class="workout__value">${workout.cadence}</span>
       <span class="workout__unit">spm</span>
      </div>
    </li>
      `;
    } else {
      html += `
       <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(2)}</span>
        <span class="workout__unit">km/h</span>
       </div>
       <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
       </div>
      </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
    clearWorkoutBtn.classList.remove('form__btn');

    //moving to workout notes
    document.querySelector('.small').classList.remove('form__btn');
  }

  _moveToMarkerOnMap(e) {
    // console.log(e.target.closest('.workout'));
    const wkEl = e.target.closest('.workout');

    //Gaurd Clause
    if (!wkEl) return;

    const workoutId = this.#workouts.find(work => work.id === wkEl.dataset.id);

    this.#map.flyTo(workoutId.coords, this.#mapZoomLevel, {
      animatio: true,
      pan: {
        duration: 2,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;

    if (data) {
      this.#workouts.forEach(work => this._renderWorkout(work));
    }
  }

  _resetWorkouts() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const mapApp = new MapApp();
