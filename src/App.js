import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import ReactModal from 'react-modal';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dataRendered: false,
            playersCount: 4,
            currentPick: null,
            previousPicks: [],
            showModal: false,
            playerName:'',
            userData: {}
        };
        this.checkIfBingo = this.checkIfBingo.bind(this);
        this.getNextNumber = this.getNextNumber.bind(this);
        this.getPreviousPicks = this.getPreviousPicks.bind(this);
        this.renderTickets = this.renderTickets.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
    }

    componentWillMount() {
        this.assignNumbersToTickets()
    }


    assignNumbersToTickets(){
        const {playersCount} = this.state;
        let userData = {};
        for (let i = 0; i < playersCount; i++) {
            let name = 'player'+(i+1);
            let numberArray = [];
            while (numberArray.length < 25) {
                const randomNumber = Math.floor(Math.random() * 99) + 1;
                if(numberArray.indexOf(randomNumber) < 0) {
                    numberArray.push(randomNumber);
                }
            }
            userData[name] = numberArray;
        }
        this.setState({
            userData
        });
    }
    handleCloseModal(){
        this.setState({showModal:false,playerName:''});

    }

    checkIfBingo(event) {
        let selectedNumbers = [];
        let playerName = '';
        if (event.currentTarget.getAttribute('data-numbers')) {
            selectedNumbers = JSON.parse(event.currentTarget.getAttribute('data-numbers'));
        }
        if (event.currentTarget.getAttribute('data-playername')) {
            playerName = event.currentTarget.getAttribute('data-playername');
        }
        if(selectedNumbers.length !==25){
            this.setState({showModal : true,playerName:'Not a winning ticket'});
        } else {
            axios.post('http://localhost:8080/checkBingo', {
                selectedNumbers
            }).then((response) => {
                if (response.data) {
                    if (response.data.msg === 'user has won the game') {
                        document.getElementById('play-btn').style.color = 'red';
                    }
                    this.setState({showModal: true, playerName: playerName + response.data.msg});
                }
            });
        }
    }

    getNextNumber() {
        let {previousPicks} = this.state;
        let options = { headers: { 'Content-Type': 'application/json'}};
        axios.get('http://localhost:8080/getRandomNumber',options)
            .then((response) => {
                if(response.data.msg){
                    this.setState({showModal : true,playerName:response.data.msg});
                    this.setState({
                        currentPick: null,
                        previousPicks: [],
                    },this.assignNumbersToTickets());
                   // this.componentWillMount();
                }else{

                    previousPicks.push(response.data.number);
                    this.setState({
                        currentPick: response.data.number,
                        previousPicks
                    });}

            })
            .catch((error) => {
                console.log(error);
            });
    }

    getPreviousPicks() {

        const {previousPicks} = this.state;
        let previousNumberArray = previousPicks.slice(Math.max(previousPicks.length - 5, 1));
        let numberElem = [];
        for (let i = 0; i < previousNumberArray.length; i++) {
            let elem = <div key={previousNumberArray[i]}> {previousNumberArray[i]} </div>
            numberElem.push(elem);
        }
        return numberElem;
    }

    renderTickets() {
        let {playersCount, userData, previousPicks} = this.state;
        let tickets = [];
        while (playersCount > 0) {
            let name = 'player' + playersCount;
            let details = userData[name];
            let ticket = [];
            let selectedNumbers = [];
            for (let j = 0; j < details.length; j++) {
                let selectedTile = false;
                if (previousPicks.indexOf(details[j]) > -1) {
                    if (typeof selectedNumbers === 'string') {
                        selectedNumbers = JSON.parse(selectedNumbers);
                    }
                    selectedNumbers.push(details[j]);
                    selectedNumbers = JSON.stringify(selectedNumbers);
                    selectedTile = true;
                }
                let elem = <div className={`Number ${selectedTile ? 'Active' : ''}`} key={details[j]}>
                    {details[j]}
                </div>;
                ticket.push(elem);
            }
            let ticketElem = <div key={playersCount} className="Ticket">
                <div>
                    { ticket }
                </div>
                <div className="Button TicketButton">
                    <button data-numbers={selectedNumbers} data-playername = {name} key={selectedNumbers} onClick={this.checkIfBingo}>Check</button>
                </div>
            </div>
            tickets.push(ticketElem);
            playersCount --;
        }
        return tickets;
    }

    render() {
        const {currentPick,playerName,showModal} = this.state;

        return (
            <div className="App">

                <div className="GameManagerContainer">
                    <div className="CurrentPick">
                        <div className="CurrentNumberText">Current Pick</div>
                        <div className="CurrentNumber">{currentPick ? currentPick : '-'}</div>
                    </div>
                    <div className="PreviousBalls">
                        <div className="PreviousBallsText">Previous Picks</div>
                        <div className="PreviousBallsNumbers">
                            { this.getPreviousPicks() }
                        </div>
                    </div>
                    <div className="Button">
                        <button id="play-btn" onClick={this.getNextNumber}>Play</button>
                    </div>
                    <div className="Clear">
                    </div>
                </div>

                <div className="TicketContainer">
                    { this.renderTickets() }
                </div>
                <ReactModal isOpen={showModal} className="msg-modal"
                    contentLabel="Minimal Modal Example">
                    {playerName}
                    <button className="modal-submit" onClick={this.handleCloseModal}>Close Modal</button>
                </ReactModal>
            </div>
        );
    }
}

export default App;
