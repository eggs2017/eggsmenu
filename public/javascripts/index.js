let socket = io.connect();

class AppComponent extends React.Component{

    constructor(props) {
        super(props);

         this.state = {
            items : [],
            nick: ''
        };
    }

    componentDidMount() {
           fetch('/reserveNick')
            .then((response) => response.json())
            .then((responseJson) => {
              let x =  responseJson;
              this.setState({nick : x.nick});
              //socket.emit('try register', x.nick);

            })
            .catch((error) => {
              console.log(error);
            });


            fetch('/getOrders')
             .then((response) => response.json())
             .then((responseJson) => {
               if(JSON.stringify(responseJson) !== JSON.stringify(this.state.items)){
                  this.setState({items : responseJson});
              }
             })
             .catch((error) => {
               console.log(error);
             });

            socket.on('update orders', (data) => {
                // React will automatically rerender the component when a new message is added.
                this.setState({ items: JSON.parse(data) });
              });

              socket.on('server exit', (data) => {
                  // React will automatically rerender the component when a new message is added.
                  UIkit.notification("<span uk-icon='icon: warning'></span> Przykro mi - Serwer został wyłączony", { pos: 'bottom-center',  status:'danger'} );
                  this.setState({ items: [] });
                });

   }

      render(){
            let nick = this.state.nick;
            let shortNick = nick.substr(0, nick.indexOf("."));
            return(
                <div class="uk-container uk-container-small uk-position-relative">

                    <span class="uk-label">Cześć: {shortNick} <code>u</code></span>
                    <div class="uk-flex-center uk-margin">
                      <hr class="uk-grid-divider"></hr>
                       <span class="uk-label">Wybierz danie</span>
                       <OrderListComponent appInstance = {this} rows={this.state.items}/>

                       <hr class="uk-grid-divider"></hr>
                       <span class="uk-label">Obserwuj tablicę zamówień</span>
                       <OrderGridComponent appInstance = {this} rows={this.state.items} />

                       <hr class="uk-grid-divider"></hr>

                       <span class="uk-label">Kontroluj rozliczenie</span>
                       <PaymentGridComponent appInstance = {this} rows={this.state.items} />


                       <hr class="uk-grid-divider"></hr>


                    </div>
                </div>
            );
        }
}

 class OrderListComponent extends React.Component {

    constructor(props) {
        super(props);

         this.state = {
            items: []
          }
    }

    componentDidMount() {
      fetch('/getmenu')
       .then((response) => response.json())
       .then((responseJson) => {
         //if(JSON.stringify(responseJson) !== JSON.stringify(this.state.items)){
            let orderedMenu = _.orderBy(responseJson, 'name');
            this.setState({items : orderedMenu});
        //}
       })
       .catch((error) => {
         console.log(error);
       });
    }


    uuidv4() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }

    sendOrderToServer(item){

        socket.emit('add order', {
                                            sender: item.nick ,
                                            body: JSON.stringify(item)
                                          }
                                        );
    }

    change(){
        const selectedItem =  $("#itemToAdd").find(':selected');
        const arrayCopy = this.props.rows;
        //detect duplicate

        let yourNick = this.props.appInstance.state.nick;
        const already = this.props.rows.filter((row) => row.name === selectedItem.attr('value') && row.nick === yourNick);

        let item;
        if(!already.length > 0){
            item =
              {
                id      : this.uuidv4(),
                name    : selectedItem.attr('value'),
                val     : parseFloat(selectedItem.attr('price')),
                nick    : yourNick,
                amount : 1
              };

            arrayCopy.push(item);
        }
        else{
            item  = already[0];
            item.amount++;
        }

        this.sendOrderToServer(item)
    }


    render(){
        var dishList = [];

        for(let d of this.state.items){
            dishList.push( <option price = {d.val}  value = {d.name}  onChange={this.change} >{d.name} cena: {d.val} zł</option> );
        }

        return (


            <div class="uk-section-small uk-section-muted">
                <div class="uk-container">
                    <div class="uk-grid uk-margin" >
                        <div class="uk-width-auto"><legend class="uk-legend"></legend> </div>
                        <div class="uk-width-3-5">
                            <form>
                                <select class="uk-select select_join" id="itemToAdd">
                                    {dishList}
                                </select>
                            </form>
                        </div>
                        <div class="uk-width-auto">
                            <button class="uk-button uk-button-default uk-button-medium uk-button-primary" onClick= {() => this.change()}> <li><a href="#" uk-icon="icon: cart"></a></li> </button>
                        </div>
                    </div>
               </div>
            </div>

        );
    }
}

class OrderGridComponent extends React.Component {

    constructor(props) {
      super(props);
       this.state = {
         nick : undefined
       }


    }

    componentDidMount(){
      this.setState({nick : this.props.appInstance.state.nick});
    }

    render() {
          let nick = this.props.appInstance.state.nick;
          var ordersTable = [];
          var sumOfSumValue = 0;
          var sumOfSumAmount = 0;
          if(this.props.rows.length > 0){
              let namedArray = _.groupBy(this.props.rows, 'name');

              _.forEach(namedArray, function(value, key) {
                let sumAmount = _.sumBy(value, function(o) { return  o.amount; });
                let sumTotal = _.sumBy(value, function(o) { return o.val * o.amount; });
                let nicksElement = '';


                ordersTable.push(<tr>
                        <td>{key}</td>
                        <td class="uk-text-center">{sumAmount} szt</td>
                        <NickComponent rows={value} loggedNick={nick} others={false}/>

                        </tr>);

                sumOfSumValue += sumTotal;
                sumOfSumAmount += sumAmount;
              });
          }

          return (
             <div class="uk-section-small uk-section-muted">
                 <table class="uk-table uk-table-small uk-table-justify">
                      <thead>
                          <tr>
                              <th class="uk-text-center" >Danie</th>
                              <th class="uk-text-center">Razem</th>
                              <th class="uk-text-center">Twoje zamówienia</th>

                          </tr>
                      </thead>
                      <tbody>
                          {ordersTable}
                      </tbody>
                </table>


                  <span class="uk-text-success">Suma kontrolna:</span> <span class="uk-badge uk-badge-notification">{parseFloat(sumOfSumValue).toFixed(2)} zł / {sumOfSumAmount} szt</span>
              </div>
          );

  }
}

/*
Shows information about person , sum to pay and allow indicate payment.
*/
class PaymentGridComponent extends React.Component{

  constructor(props) {
      super(props);
      this.state = {
         paymentStatus : []
     };
  }

  componentDidMount() {


    fetch('/getPayments')
     .then((response) => response.json())
     .then((responseJson) => {
       if(JSON.stringify(responseJson) !== JSON.stringify(this.state.paymentStatus)){
          this.setState({paymentStatus : responseJson});
      }
     })
     .catch((error) => {
       console.log(error);
     });


    socket.on('update payment', (data) => {
      // React will automatically rerender the component when a new message is added.
      this.setState({ paymentStatus: JSON.parse(data) });
    });
  }


  doPaymentAction(approvedBy, paymentFor, sumTotal){
    console.log("doPaymentAction for " + paymentFor);
      socket.emit('doPayment', {approvedBy: approvedBy, paymentFor: paymentFor, sumTotal: sumTotal});
  }

  removePaymentAction(approvedBy, paymentFor){
    console.log("removePaymentAction " + paymentFor);
      socket.emit('removePayment', {approvedBy: approvedBy, paymentFor: paymentFor});
  }

  render(){

    let nickLogged = this.props.appInstance.state.nick;


    var paymentTable = [];
    var sumOfValue = 0;

    let key =- "s";
    let sumTotal  = 0;
    if(this.props.rows.length > 0){
        let namedArray = _.groupBy(this.props.rows, 'nick');

        //due to problem with lodash forEach and react.
        let sumTotalTable = [];
        _.forEach(namedArray, function(value, key) {
          let sumTotal = _.sumBy(value, function(o) { return o.val * o.amount; });
          sumTotalTable.push( {nick: key , sumTotal: sumTotal});
        });

        for(let row of sumTotalTable){

            let nick = this.state.nick;
            let shortNick = row.nick.substr(0, row.nick.indexOf(".")).toLowerCase();
            //check is nick in payment ordersTable
            let isInPayment = false;
            let findElem = this.state.paymentStatus.find(function(element){
              return element.paymentFor ===  row.nick;
            });

            if(findElem != undefined){
              let shortApprovedBy = findElem.approvedBy.substr(0, findElem.approvedBy.indexOf(".")).toLowerCase();;

              paymentTable.push(<tr>
                    <td class="uk-text-center">{shortNick}</td>
                    <td class="uk-text-center"><code>{row.sumTotal} zł </code></td>
                    <td class="uk-text-center">
                        <button class="uk-button uk-button-primary uk-button-small" onClick= {() => this.removePaymentAction(nickLogged, row.nick)} >Usuń wszystko</button>
                    </td>
                    <td class="uk-text-center">{shortApprovedBy}  {findElem.sumTotal} zł</td>
                  </tr>);
            }
            else {
                paymentTable.push(<tr>
                      <td class="uk-text-center">{shortNick}</td>
                      <td class="uk-text-center"><code>{row.sumTotal} zł </code></td>
                      <td class="uk-text-center">
                          <button class="uk-button uk-button-primary uk-button-small" onClick= {() => this.doPaymentAction(nickLogged, row.nick, row.sumTotal)} ><code>Potwierdź wpłatę</code></button>
                      </td>
                      <td></td>
                    </tr>);
            }
        }
    }

    return(
    <div class="uk-section-small uk-section-muted">
        <table class="uk-table uk-table-small uk-table-justify">
             <thead>
                 <tr>
                     <th class="uk-text-center">Osoba</th>
                     <th class="uk-text-center">Razem</th>
                     <th class="uk-text-center">Płatność</th>
                     <th class="uk-text-center">Zatwierdził</th>
                 </tr>
             </thead>
             <tbody>
                 {paymentTable}
             </tbody>
       </table>
     </div>
   );
  }
}

class NickComponent extends React.Component {
  removeOrder(rowId, rowNick){
    socket.emit('removeItem', {sender: rowNick, body: rowId});
 }
  render(){
     let table = []
        let nick = this.props.loggedNick;
        let sortedRows = _.orderBy(this.props.rows, 'nick');

          //put logged user first
          let filtered = _.filter(sortedRows, { 'nick': nick });
          for(let row of filtered){
              //table.push(<button  class="uk-button-small " uk-icon="icon: trash" type="button"  onClick= {() => this.removeOrder(row.id, row.nick)} > {row.amount} szt</button>);
              table.push(<span class="uk-badge uk-badge-notification"> {row.amount} szt</span>);
          }

        return(
              <td class="uk-text-center">{table}</td>
              //<td><span class="uk-badge uk-badge-notification"></span></td>
        );
    }
}

//Main element
ReactDOM.render(<AppComponent/>, document.getElementById('rootApp'));
