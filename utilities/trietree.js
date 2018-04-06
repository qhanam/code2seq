/**
 * Constructor for TrieMinHeap.
 * 
 * TrieMinHeap finds the {@code maxHeapSize} most frequent words in a document.
 */
function TrieMinHeap(maxHeapSize) {

	if(maxHeapSize < 1) throw "Size of heap must be greater than zero.";

	this.head = {
			character : '',
		  children: {}
	};

	this.heap = new Array(maxHeapSize);
	for(let i = 0; i < this.heap.length; i++) this.heap[i] = null;
	this.heapSize = 0;

}

TrieMinHeap.prototype.swap = function(indexOne, indexTwo) {
	let tmp = this.heap[indexOne];
	this.heap[indexOne] = this.heap[indexTwo];
	this.heap[indexTwo] = tmp;
	this.heap[indexOne].trieNode.heapIndex = indexOne;
	this.heap[indexTwo].trieNode.heapIndex = indexTwo;
}

TrieMinHeap.prototype.parentOf = function(index) {
	return Math.floor((index - 1) / 2);
}

/**
 * @return the index of the inserted node.
 */
TrieMinHeap.prototype.insertToHeap = function(heapNode) {

	/* Case 1: Array is full, so replace the minimum element. */
	if(this.heapSize === this.heap.length) {
		this.heap[0].trieNode.heapIndex = null;
		this.heap[0] = heapNode;
		heapNode.trieNode.heapIndex = 0;
		return 0;
	}

	/* Case 2: Array is not full, so add and bubble up. */
	else {

		let index = this.heapSize;
		let parentIndex = this.parentOf(index);

		this.heap[index] = heapNode;
		this.heapSize++;
		heapNode.trieNode.heapIndex = index;

		while(index !== parentIndex 
				&& this.heap[index].count < this.heap[parentIndex].count) {
			this.swap(index, parentIndex);
			index = parentIndex;	
			parentIndex = this.parentOf(index);
		}

		return index;

	}

}

TrieMinHeap.prototype.updateHeapNode = function(index, count) {
	this.heap[index].count = count;

	let word = this.heap[index].word;

	/* Bubble down. */
	while(true) {
		let leftChildIndex = (index * 2) + 1;
		let rightChildIndex = (index * 2) + 2;

		if(leftChildIndex > this.heapSize - 1) return index;
		if(rightChildIndex > this.heapSize - 1) rightChildIndex = leftChildIndex;

		let minIndex = this.heap[leftChildIndex].count < this.heap[rightChildIndex].count ? 
			leftChildIndex : rightChildIndex;

		if(this.heap[index].count > this.heap[minIndex].count) this.swap(index, minIndex);
		else return;

		index = minIndex;
	}
}

/**
 * Update the min heap if needed.
 */
TrieMinHeap.prototype.updateHeap = function(word, trieNode) {

	/* Base case: no value in min heap, add a new heapNode as the minimum element. */
	if(this.heapSize === 0) {
		this.heap[0] = { word: word, count: trieNode.count, trieNode: trieNode };
		trieNode.heapIndex = 0;
		this.heapSize++;
	}
	
	/* Case 1: Not in the heap, add a new heapNode. */
	else if(trieNode.heapIndex === null) {
		if(this.heap[0].count > trieNode.count) return;
		this.insertToHeap({ word: word, count: trieNode.count, trieNode: trieNode });
	}

	/* Case 2: Allready in the heap, update the heapNode. */
	else {
		this.updateHeapNode(trieNode.heapIndex, trieNode.count);	
	}

}

/**
 * Increment the word count.
 */
TrieMinHeap.prototype.incrementWordCount = function(word) {

	var trieNode = this.head;
	var character = null;
	var suffix = word;
	
	if(suffix.length === 0) return;
	
	character = suffix.slice(0,1);
	suffix = suffix.slice(1);

	/* Travel down the tree as far as possible. */
	while(trieNode.children[character] !== undefined && character.length > 0){
		trieNode = trieNode.children[character];
		character = suffix.slice(0,1);
		suffix = suffix.slice(1);
	}

	/* Create new trieNodes for the remaining characters. */
	while(character.length > 0) {

		trieNode.children[character] = {
				character : character,
				count : suffix.length === 0 ? 0 : null,
				children : {},
				heapIndex : null
			};

		trieNode = trieNode.children[character];
		character = suffix.slice(0,1);
		suffix = suffix.slice(1);

	}

	/* The complete word has been processed, so (1) increment the word counter
	 * and (2) insert the word into the min heap. */
	trieNode.count = trieNode.count === null ? 1 : trieNode.count + 1;

	/* Try to insert this into the max heap. */
	this.updateHeap(word, trieNode);

};

TrieMinHeap.prototype.printHeap = function() {
	console.log("-------");
	for(let i = 0; i < this.heapSize; i++) {
		console.log(i + "\t" + this.heap[i].word + ":" + this.heap[i].count);
	}
	console.log("-------");
}

TrieMinHeap.prototype.forEach = function(f) {
	for(let i = 0; i < this.heapSize; i++) {
		f(this.heap[i].word);
	}
}

module.exports = TrieMinHeap;
