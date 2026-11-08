<?php

declare(strict_types=1);

namespace HisabAlUmr\AgeCalculator;

final class AgeException extends \InvalidArgumentException
{
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly ?string $field = null,
    ) {
        parent::__construct($message);
    }
}
