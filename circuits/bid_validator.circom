pragma circom 2.1.3;

include "../node_modules/circomlib/circuits/comparators.circom";

template BidValidator() {
    // Private input: the bid value.
    signal input bid;
    // Public output: 1 if bid > 0, 0 otherwise.
    signal output isPositive;
    
    // Instantiate a LessThan comparator for 32-bit numbers.
    component lt = LessThan(32);
    lt.in[0] <== 0;    // left-hand side is 0.
    lt.in[1] <== bid;  // right-hand side is the bid.
    
    // The comparator outputs 1 if 0 < bid.
    isPositive <== lt.out;
}

component main = BidValidator();