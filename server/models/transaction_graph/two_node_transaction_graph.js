const TransactionGraph = require('./transaction_graph.js');
const Block = require('../block.js');
const Edge = require('./edge.js');
const Node = require('./node.js');

const defaultSize = 1;
const arrow = 'arrow';
const colour1 = '#07272E';

// Subclass for transaction graph
function TwoNodeTransactionGraph() {
  this.edgeCount = 0;
  this.range;
  this.allTransactions = [];
  this.transactionHashMap = {};
  TransactionGraph.call(this);
}

TwoNodeTransactionGraph.prototype = Object.create(TransactionGraph.prototype);
TwoNodeTransactionGraph.prototype.constructor = TwoNodeTransactionGraph;

TwoNodeTransactionGraph.prototype.processBlocks = function(blockId, count, info, callback, request, response, directed) {
  if (count > 0) {
    Block.getBlock(blockId, (block) => {
      console.log('Block number: ' + block.number + ' and count: ' + count);
      this.processTransactionsToGraph(block.transactions, info);
      this.processBlocks(block.parentHash, count-1, info, callback, request, response, directed);
    })
  } else {
    this.range = range(this.transactionHashMap);
    for (var i = 0; i < this.allTransactions.length; i++) {
      var property = this.allTransactions[i].from.address + this.allTransactions[i].to.address;
      var value = this.transactionHashMap[property];
      var percent = (value - this.range[0])/ (this.range[1] - this.range[0])
      var edgeColour = shadeColor2(colour1, percent);
      this.processTransaction(this.allTransactions[i].from, this.allTransactions[i].to, edgeColour);
    }
    callback(this, request, response, directed);
  }
}

TwoNodeTransactionGraph.prototype.processTransactionsToGraph = function(transactions, info) {
  console.log("Processing transactions");
  if (info == 'value') {
    //Remeber to do calculations according to bignumber
  }
  else {
    for (var i = 0; i < transactions.length; i++) {
      var check = transactions[i].from.address + transactions[i].to.address;
      if (this.transactionHashMap.hasOwnProperty(check)) {
        this.transactionHashMap[check] = this.transactionHashMap[check] + transactions[i].gasUsed;
      } else {
        this.allTransactions.push({
          from : transactions[i].from,
          to : transactions[i].to
        })
        this.transactionHashMap[check] = transactions[i].gasUsed;
      }
    }
  }
}

TwoNodeTransactionGraph.prototype.processTransaction = function(sender, reciever, colour) {
  TransactionGraph.prototype.processTransaction.call(this, sender, reciever);
  this.edges.push(new Edge(this.edgeCount, sender.address, reciever.address, colour, defaultSize, arrow)); this.edgeCount++;
}

TwoNodeTransactionGraph.prototype.deleteProperties = function() {
  TransactionGraph.prototype.deleteProperties.call(this);
  delete this.edgeCount;
  delete this.range;
  delete this.allTransactions;
  delete this.transactionHashMap;
}

function range(hashMap) {
  var lowest = hashMap[Object.getOwnPropertyNames(hashMap)[0]];
  var highest = hashMap[Object.getOwnPropertyNames(hashMap)[0]];
  for (var hash in hashMap) {
    if (hashMap.hasOwnProperty(hash)) {
      var gas = hashMap[hash];
      if (gas < lowest) lowest = gas;
      if (gas > highest) highest = gas;
    }
  }
  return [lowest, highest];
}

//Taken from stackoverflow: https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeColor2(colour, percent) {
    var f = parseInt(colour.slice(1),16);
    var t = percent < 0 ? 0 : 255;
    var p = percent < 0 ? percent * - 1 : percent;
    var R = f >> 16;
    var G = f >> 8 & 0x00FF;
    var B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) *p ) + B)).toString(16).slice(1);
}

module.exports = TwoNodeTransactionGraph;
