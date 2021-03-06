import React, {Component} from 'react';
import EventUI from '../../components/events/EventUI';
import firebase from 'react-native-firebase';
import arrayShuffle from 'array-shuffle';

export default class EventScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            event: {},
            contacts: []
        }
    }
    componentDidMount(){
        this.eventId = this.props.navigation.getParam('eventId');
        this.db = firebase.firestore();
        this.findEventOnFirebase();
    }
    findEventOnFirebase = async () => {
        let eventRef = await this.db.collection('events').doc(this.eventId);
        let doc = await eventRef.get();
        let event = doc.data();
        this.setState({event});
        eventRef.collection('contacts').onSnapshot((querySnapshot) => {
            querySnapshot.docChanges.forEach((change)=>{
                if (change.type == 'added')
                    this.addContact({uid: change.doc.id, ...change.doc.data()})
                if (change.type == 'modified'){
                    this.clearContact(change.doc);
                    this.addContact({uid: change.doc.id, ...change.doc.data()})
                }
            })
        })
    }
    shuffleUsers = async () => {
        let contactsRandom = arrayShuffle(this.state.contacts);
        for(let i = 0; i<contactsRandom.length; i++) {
            let currentUser = contactsRandom[i];
            let nextUser;
            if(i == (contactsRandom.length -1)) {
                nextUser = contactsRandom[0];
            }else {
                nextUser = contactsRandom[i+1];
            }
            await firebase.firestore()
                .collection('events').doc(this.eventId)
                .collection('contacts').doc(currentUser.uid).update({
                    friend: {
                        name: nextUser.name,
                        avatar: nextUser.avatar
                    }
                });
        }
        return true;
    }
    addContact = (contact) => {
        this.setState({
            contacts: this.state.contacts.concat([contact])
        });
    }
    clearContact = (contact) => {
        console.log(this.state.contacts);
        this.setState({
            contacts: this.state.contacts.filter(contactOld => contactOld.uid != contact.id )
        });
    }

    openContactsScreen = ()=>{
        this.props.navigation.navigate('Contacts',{
            eventId: this.eventId
        })
    }
    render() {
        return (
            <EventUI 
                event={this.state.event} 
                contacts={this.state.contacts}
                openContactsScreen={this.openContactsScreen}
                shuffleUsers={this.shuffleUsers}
            />
        )
    }
}